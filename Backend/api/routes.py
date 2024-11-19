import os
import sys
from datetime import datetime, timezone, timedelta

from functools import wraps
from subprocess import run
from time import sleep

from flask import request, jsonify, send_file
from flask_restx import Api, Resource, fields

import jwt
from ytmusicapi import YTMusic

from .models import db, Users, JWTTokenBlocklist, History, SearchHistory
from .config import BaseConfig
import requests

import json

from .utils import trim_song, timed, get_unique

rest_api = Api(version="1.0", title="Users API")

yt = YTMusic(location="US", language="en")

"""
    Flask-Restx models for api request and response data
"""

signup_model = rest_api.model('SignUpModel', {"username": fields.String(required=True, min_length=2, max_length=32),
                                              "email": fields.String(required=True, min_length=4, max_length=64),
                                              "password": fields.String(required=True, min_length=4, max_length=16)
                                              })

login_model = rest_api.model('LoginModel', {"email": fields.String(required=True, min_length=4, max_length=64),
                                            "password": fields.String(required=True, min_length=4, max_length=16)
                                            })

user_edit_model = rest_api.model('UserEditModel', {"userID": fields.String(required=True, min_length=1, max_length=32),
                                                   "username": fields.String(required=True, min_length=2,
                                                                             max_length=32),
                                                   "email": fields.String(required=True, min_length=4, max_length=64)
                                                   })

search_model = rest_api.model('SearchModel', {"prompt": fields.String(required=True, min_length=1, max_length=32),
                                              })

get_song_model = rest_api.model('GetSongModel', {"songID": fields.String(required=True)})

get_artist_model = rest_api.model('GetArtistModel', {"artistID": fields.String(required=True)})

get_album_model = rest_api.model('GetAlbumModel', {"albumID": fields.String(required=True)})

search_suggestions_model = rest_api.model('SearchSuggestionsModel',
                                          {"prompt": fields.String(required=True, min_length=1, max_length=32)})

get_artist_songs_model = rest_api.model('GetArtistSongsModel', {
    "artistID": fields.String(required=True, description="returned by get_artist in songs")})

get_artist_albums_model = rest_api.model('GetArtistAlbumsModel',
                                         {"browseID": fields.String(required=True,
                                                                    description="returned by get_artist in albums"),
                                          "params": fields.String(required=True,
                                                                  description="returned by get_artist in albums ")
                                          })

get_history_model = rest_api.model('GetHistoryModel',
                                   {"userID": fields.String(required=True, min_length=1, max_length=32)})

"""
   Helper function for JWT token required
"""


def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):

        token = None

        if "authorization" in request.headers:
            token = request.headers["authorization"]

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            current_user = Users.get_by_email(data["email"])

            if not current_user:
                return {"success": False,
                        "msg": "Sorry. Wrong auth token. This user does not exist."}, 400

            # if datetime.utcfromtimestamp(data['exp']) < datetime.utcnow():
            token_expired = db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "msg": "Token revoked."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "msg": "Token expired."}, 400

        except:
            return {"success": False, "msg": "Token is invalid"}, 400

        return f(current_user, *args, **kwargs)

    return decorator


"""
    Flask-Restx routes
"""


@rest_api.route('/api/users/register')
class Register(Resource):
    """
       Creates a new user by taking 'signup_model' input
    """

    @rest_api.expect(signup_model, validate=True)
    def post(self):
        req_data = request.get_json()

        _username = req_data.get("username")
        _email = req_data.get("email")
        _password = req_data.get("password")

        user_exists = Users.get_by_email(_email)
        if user_exists:
            return {"success": False,
                    "msg": "Email already taken"}, 400

        new_user = Users(username=_username, email=_email)

        new_user.set_password(_password)
        new_user.save()

        return {"success": True,
                "userID": new_user.id,
                "msg": "The user was successfully registered"}, 200


@rest_api.route('/api/users/login')
class Login(Resource):
    """
       Login user by taking 'login_model' input and return JWT token
    """

    @rest_api.expect(login_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _email = req_data.get("email")
        _password = req_data.get("password")

        user_exists = Users.get_by_email(_email)

        if not user_exists:
            return {"success": False,
                    "msg": "This email does not exist."}, 400

        if not user_exists.check_password(_password):
            return {"success": False,
                    "msg": "Wrong credentials."}, 400

        # create access token using JWT
        token = jwt.encode({'email': _email, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True,
                "token": token,
                "user": user_exists.toJSON()}, 200


@rest_api.route('/api/users/edit')
class EditUser(Resource):
    """
       Edits User's username or password or both using 'user_edit_model' input
    """

    @rest_api.expect(user_edit_model)
    @token_required
    def post(self, current_user):

        req_data = request.get_json()

        _new_username = req_data.get("username")
        _new_email = req_data.get("email")

        if _new_username:
            self.update_username(_new_username)

        if _new_email:
            self.update_email(_new_email)

        self.save()

        return {"success": True}, 200


@rest_api.route('/api/users/logout')
class LogoutUser(Resource):
    """
       Logs out User using 'logout_model' input
    """

    @token_required
    def post(self, current_user):
        _jwt_token = request.headers["authorization"]

        jwt_block = JWTTokenBlocklist(jwt_token=_jwt_token, created_at=datetime.now(timezone.utc))
        jwt_block.save()

        self.set_jwt_auth_active(False)
        self.save()

        return {"success": True}, 200


@rest_api.expect(get_song_model)
@rest_api.route("/api/get_song")
class GetSong(Resource):
    @timed
    def get(self):
        song_id = request.args.get("songID")

        dir_path = "song_storage/"

        path = dir_path + str(song_id) + ".mp3"

        command = f"yt-dlp -f 249 {str(song_id)} -o {path}"

        if not os.path.exists(path):
            run(command, shell=True)
        return send_file("../" + path, mimetype="audio/mp3")


@rest_api.expect(get_song_model)
@rest_api.route("/api/authorized/get_song")
class GetSongAuthorized(GetSong):
    @token_required
    @timed
    def get(self, current_user):
        song_id = request.args.get("songID")
        song = yt.get_song(song_id)

        user_id = self.id

        history_item = History(user_id=user_id, video_details=json.dumps(song['videoDetails']))
        history_item.save()

        song = trim_song(song)

        response = GetSong.get(self)
        return response


@rest_api.expect(search_model)
@rest_api.route("/api/search")
class Search(Resource):

    @timed
    def get(self):

        prompt = request.args.get("prompt")
        songs = get_unique(yt.search(prompt, filter="songs", limit=20), "videoId")
        albums = get_unique(yt.search(prompt, filter="albums", limit=20), 'browseId')
        artists = get_unique(yt.search(prompt, filter="artists", limit=20), 'browseId')

        try:
            for song in songs:
                for i in ['feedbackTokens', 'inLibrary', 'category', 'videoType', 'year', "resultType"]:
                    song.pop(i)
            for album in albums:
                for i in ['category', "resultType"]:
                    album.pop(i)
            for artist in artists:
                for i in ['category', "resultType"]:
                    artist.pop(i)
        except:
            pass

        return {"success": True,
                "response":
                    {
                        "songs": songs,
                        "albums": albums,
                        "artists": artists
                    }
                }, 200


@rest_api.expect(search_model)
@rest_api.route("/api/authorized/search")
class SearchAuthorized(Search):
    @token_required
    @timed
    def get(self, current_user):
        prompt = request.args.get("prompt")

        user_id = self.id

        search_history_item = SearchHistory(user_id=user_id, search_prompt=prompt)
        search_history_item.save()

        response = Search.get(self)
        return response


@rest_api.expect(search_suggestions_model)
@rest_api.route("/api/search_suggestions")
class SearchSuggestions(Resource):

    @timed
    def get(self):
        prompt = request.args.get("prompt")
        search_suggestions = yt.get_search_suggestions(prompt)
        return {"success": True,
                "response": search_suggestions
                }, 200


@rest_api.expect(get_album_model)
@rest_api.route("/api/get_album")
class GetAlbum(Resource):

    @timed
    def get(self):
        album_id = request.args.get("albumID")
        album = yt.get_album(album_id)
        return {"success": True,
                "response": album
                }, 200


@rest_api.expect(get_artist_model)
@rest_api.route("/api/get_artist")
class GetArtist(Resource):
    @timed
    def get(self):
        artist_id = request.args.get("artistID")
        artist = yt.get_artist(artist_id)
        try:
            for i in ['videos', 'subscribers', 'subscribed']:
                artist.pop(i)
        except:
            pass
        return {"success": True,
                "response": artist
                }, 200


@rest_api.expect(get_artist_songs_model)
@rest_api.route("/api/get_artist_songs")
class GetArtistSongs(Resource):
    @timed
    def get(self):
        browse_id = request.args.get("browseID")
        artist_songs = yt.get_playlist(browse_id)

        try:
            for i in ['title', 'artists', 'related', 'views', "description", "year", "owned"]:
                artist_songs.pop(i)
        except:
            pass

        return {"success": True,
                "response": artist_songs
                }, 200


@rest_api.expect(get_artist_albums_model)
@rest_api.route("/api/get_artist_albums")
class GetArtistAlbums(Resource):
    @timed
    def get(self):
        browse_id = request.args.get("browseID")
        params = request.args.get("params")
        artist_albums = yt.get_artist_albums(browse_id, params=params)
        return {"success": True,
                "response": artist_albums
                }, 200


# @rest_api.expect(get_home_model)
@rest_api.route("/api/get_home")
class GetHome(Resource):
    @timed
    def get(self):
        home = yt.get_home(limit=20)

        try:
            for i in ['Популярно в Shorts', 'Видеоклипы для вас', 'Popular in shorts', 'Music videos for you']:
                home.pop(i)
        except:
            pass

        print([i['title'] for i in home])

        return {"success": True,
                "response": home
                }, 200


# @rest_api.expect(get_history_model)
@rest_api.route("/api/authorized/get_history")
class GetHistory(Resource):
    @token_required
    @timed
    def get(self, current_user):
        user_id = self.id

        user_history = [i.toJSON() for i in History.get_by_user_id(user_id=user_id)]

        return {"success": True,
                "response": user_history
                }, 200


@rest_api.route("/api/authorized/get_search_history")
class GetSearchHistory(Resource):
    @token_required
    @timed
    def get(self, current_user):
        user_id = self.id

        search_history = SearchHistory.get_by_user_id(user_id=user_id)

        return {"success": True,
                "response": search_history
                }, 200
