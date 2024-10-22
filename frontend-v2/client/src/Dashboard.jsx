import useAuth from "./useAuth";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Player from "./Player";


const SpotifyApi = new SpotifyWebApi({ 
  clientId: 'cdcc0f73d85f4256bb61e5db41276e86'
 })


 export default function Dashboard({ code }) {
  const accessToken = useAuth(code);  

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();

  function chooseTrack(track) {
    setPlayingTrack(track);
    //setSearch('');
  }

  useEffect(() => {
    if (!accessToken) return
    SpotifyApi.setAccessToken(accessToken)
  }, [accessToken])
  
  useEffect(() => {
    if (!search) return setSearchResults([])
    if (!accessToken) return

    let cancel = false

    SpotifyApi.searchTracks(search).then(res => {
      if (cancel) return
      setSearchResults(res.body.tracks.items.map(track => {

        const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
          if (image.height < smallest.height) return image
          return smallest
        }, track.album.images[0])

        return {
          artist: track.artists[0].name,
          title: track.name,
          uri: track.uri,
          albumUrl: smallestAlbumImage.url
        }
      }))
    })

    return () => cancel = true;
  }, [search, accessToken])
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <form className="w-full max-w-lg mb-8" onSubmit={(e) => e.preventDefault()}>
        <input 
          type="search" 
          placeholder="Search Songs" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </form>
      
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Songs</h2>
        {searchResults.map(track => (
          <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
        ))}
      </div>
      <div className="fixed bottom-0 w-full max-w-lg">
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </div>
  );
}

