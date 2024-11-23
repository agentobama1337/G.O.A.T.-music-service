import pytest
import json
from api import app

"""
   Sample test data
"""

TEST_USERNAME = "test"
TEST_EMAIL = "test@test.com"
TEST_PASS = "newpassword"


@pytest.fixture
def client():
    with app.test_client() as client:
        yield client


def test_user_signup(client):
    """
       Tests /users/register API
    """
    response = client.post(
        "api/users/register",
        data=json.dumps(
            {
                "username": TEST_USERNAME,
                "email": TEST_EMAIL,
                "password": TEST_PASS
            }
        ),
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert "The user was successfully registered" in data["msg"]


def test_user_signup_invalid_data(client):
    """
       Tests /users/register API: invalid data like email field empty
    """
    response = client.post(
        "api/users/register",
        data=json.dumps(
            {
                "username": TEST_USERNAME,
                "email": "",
                "password": TEST_PASS
            }
        ),
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 400
    assert "'' is too short" in data["msg"]


def test_user_login_correct(client):
    """
       Tests /users/signup API: Correct credentials
    """
    response = client.post(
        "api/users/login",
        data=json.dumps(
            {
                "email": TEST_EMAIL,
                "password": TEST_PASS
            }
        ),
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["token"] != ""


def test_user_login_error(client):
    """
       Tests /users/signup API: Wrong credentials
    """
    response = client.post(
        "api/users/login",
        data=json.dumps(
            {
                "email": TEST_EMAIL,
                "password": TEST_EMAIL
            }
        ),
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 400
    assert "Wrong credentials." in data["msg"]


def test_search(client):
    """
       Tests /search: Existing name
    """
    response = client.get(
        "api/search?prompt=snow",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"]["songs"] != []


def test_search_suggestions(client):
    """
       Tests /search_suggestions: Suggesting correct prompt
    """
    response = client.get(
        "api/search_suggestions?prompt=red",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"]["songs"] != []
    assert "red hot chili peppers" in data["response"]


def test_get_artist(client):
    """
       Tests /get_artist: Existing id
    """
    response = client.get(
        "api/get_artist?artistID=UCdyqvgHHq9NEEfV20lO61jQ",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"] != {}


def test_get_album(client):
    """
       Tests /get_album: Existing id
    """
    response = client.get(
        "api/get_album?artistID=MPREb_ZLzUburIGbF",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"] != {}


def test_get_history(client, token):
    """
       Tests /get_history: Existing user authorized
    """

    response = client.get(
        "api/get_history",
        headers=[f"authorization:{token}"],
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200


def test_get_search_history(client, token):
    """
       Tests /get_search_history: Existing user authorized
    """

    response = client.get(
        "api/get_search_history",
        headers=[f"authorization:{token}"],
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200


def test_get_artist_songs(client):
    """
       Tests /get_artist_songs: Existing id
    """
    response = client.get(
        "api/get_artist_songs?browseID=VLOLAK5uy_newzHdz5ncaeajopjPvxnrivVvtG4NKMk",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"] != {}


def test_get_artist_albums(client):
    """
       Tests /get_artist_albums: Existing id and params
    """
    response = client.get(
        "api/get_artist_albums?browseID=MPADUCdyqvgHHq9NEEfV20lO61jQ&params=ggMIegYIARoCAQI%3D",
        content_type="application/json")

    data = json.loads(response.data.decode())
    assert response.status_code == 200
    assert data["response"] != {}
