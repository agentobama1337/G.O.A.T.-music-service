import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Loader } from 'lucide-react';
import AlbumView from './AlbumView';
import ArtistView from './ArtistView';
import SearchWithSuggestions from './SearchWithSuggestions';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

const MusicApp = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('search');
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    login();
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async () => {
    try {
      const { data } = await api.post('/api/users/login', {
        email: "test@appseed.us",
        password: "pass"
      });
      
      if (data.success && data.token) {
        setToken(data.token);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSearch = useCallback(async (e) => {
    const query = e.target.value;
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length > 0 && token) {
        try {
          const { data } = await api.get('/api/search', {
            params: { prompt: query }
          });
          
          if (data.success) {
            console.log('Search response:', data.response);
            setSearchResults([data.response]);
          } else {
            console.log('Invalid response format:', data);
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Search error:', error.response?.data || error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 500ms delay
  }, [token]);

  // Make sure to clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const handlePlayTrack = async (track, tracksList = null) => {
    if (!token || !track || !track.videoId) return;
    
    setIsLoading(true);
    
    // Обновляем плейлист
    if (tracksList) {
      setPlaylist(tracksList);
      const index = tracksList.findIndex(t => t.videoId === track.videoId);
      setCurrentTrackIndex(index);
    } else if (searchResults[0]?.songs?.length > 0) {
      // Если tracksList не передан, но есть результаты поиска, используем их
      setPlaylist(searchResults[0].songs);
      const index = searchResults[0].songs.findIndex(t => t.videoId === track.videoId);
      setCurrentTrackIndex(index);
    }
    
    try {
      const response = await api.get('/api/get_song', {
        params: { songID: track.videoId },
        responseType: 'blob'
      });
  
      if (response.data) {
        setCurrentTrack(track);
        if (audioRef.current) {
          const url = URL.createObjectURL(response.data);
          audioRef.current.src = url;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (playError) {
            console.error('Error playing audio:', playError);
            setIsPlaying(false);
          }
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextTrack = () => {
    if (playlist.length === 0 || currentTrackIndex === -1) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    handlePlayTrack(playlist[nextIndex]);
    setCurrentTrackIndex(nextIndex);
  };

  const handlePrevTrack = () => {
    if (playlist.length === 0 || currentTrackIndex === -1) return;
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    handlePlayTrack(playlist[prevIndex]);
    setCurrentTrackIndex(prevIndex);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleArtistClick = (artist) => {
    setCurrentArtist(artist);
    setCurrentView('artist');
  };

  const handleAlbumClick = (album) => {
    setCurrentAlbum(album);
    setCurrentView('album');
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const bounds = progressRef.current.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    const percentage = x / width;
    const newTime = percentage * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const handleProgressDrag = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const bounds = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const percentage = x / bounds.width;
    const newTime = percentage * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Вспомогательная функция для безопасного получения URL миниатюры
  const getThumbnailUrl = (song) => {
    if (song?.thumbnails?.length > 0 && song.thumbnails[0]?.url) {
      return song.thumbnails[0].url;
    }
    return ''; // или URL изображения-заглушки
  };

  // Вспомогательная функция для получения имен исполнителей
  const getArtistNames = (song) => {
    if (song?.artists && Array.isArray(song.artists)) {
      return song.artists.map(artist => artist?.name || '').filter(Boolean).join(', ');
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4 bg-white shadow flex justify-between items-center">
        <SearchWithSuggestions
          onSearch={handleSearch}
          isDisabled={!isLoggedIn}
          api={api}
        />
        <div className="ml-4">
          {isLoggedIn ? (
            <span className="text-green-500">Connected</span>
          ) : (
            <span className="text-red-500">Connecting...</span>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {currentView === 'search' ? (
        <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Search Results</h2>

        
        
        {searchResults.length > 0 && (
          <div className="space-y-6">
            {/* Albums Section */}
            {searchResults[0].albums && searchResults[0].albums.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Albums</h3>
                <div className="space-y-2">
                  {searchResults[0].albums.map((album, index) => album && (
                    <div
                      key={album.browseId || index}
                      onClick={() => handleAlbumClick(album)}
                      className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      {getThumbnailUrl(album) && (
                        <img
                          src={getThumbnailUrl(album)}
                          alt={album.title || 'Album thumbnail'}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div className="ml-3">
                        <div className="font-semibold">{album.title || 'Unknown Title'}</div>
                        <div className="text-sm text-gray-600">{album.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Songs Section */}
            {searchResults[0].songs && searchResults[0].songs.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Songs</h3>
                <div className="space-y-2">
                  {searchResults[0].songs.map((song, index) => song && (
                    <div
                      key={song.videoId || index}
                      onClick={() => handlePlayTrack(song, searchResults[0].songs)}
                      className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      {getThumbnailUrl(song) && (
                        <img
                          src={getThumbnailUrl(song)}
                          alt={song.title || 'Song thumbnail'}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div className="ml-3">
                        <div className="font-semibold">{song.title || 'Unknown Title'}</div>
                        <div className="text-sm text-gray-600">{song.type}</div>
                      </div>
                      {song.type === 'Single' && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded">
                          Single
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Artists Section */}
            {searchResults[0].artists && searchResults[0].artists.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Artists</h3>
                <div className="space-y-2">
                  {searchResults[0].artists.map((artist, index) => artist && (
                    <div
                      key={artist.browseId || index}
                      onClick={() => handleArtistClick(artist.browseId)}
                      className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      {getThumbnailUrl(artist) && (
                        <img
                          src={getThumbnailUrl(artist)}
                          alt={artist.title || 'Artist thumbnail'}
                          className="w-12 h-12 rounded-full" // круглая форма для артистов
                        />
                      )}
                      <div className="ml-3">
                        <div className="font-semibold">{artist.artist || 'Unknown Artist'}</div>
                        {artist.type && (
                          <div className="text-sm text-gray-600">{artist.type}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      ) : currentView === 'artist' ? (
        <ArtistView
          browseId={currentArtist}
          onBackClick={() => {
            setCurrentView('search');
            setCurrentArtist(null);
          }}
          onTrackSelect={handlePlayTrack}
          api={api}
        />
      ) : (
        <AlbumView
          browseId={currentAlbum?.browseId}
          onBackClick={() => {
            setCurrentView('search');
            setCurrentAlbum(null);
          }}
          onTrackSelect={handlePlayTrack}
          api={api}
        />
      )}
    
    

    <div className="bg-white border-t p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center w-1/4">
            {currentTrack && (
              <>
                {getThumbnailUrl(currentTrack) && (
                  <img
                    src={getThumbnailUrl(currentTrack)}
                    alt={currentTrack.title || 'Current track'}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div className="ml-3">
                  <div className="font-semibold">{currentTrack.title || 'Unknown Title'}</div>
                  <div className="text-sm text-gray-600">
                    {getArtistNames(currentTrack)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center w-2/4">
            <button 
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={handlePrevTrack}
              disabled={playlist.length === 0}
            >
              <SkipBack size={20} className={playlist.length === 0 ? 'text-gray-300' : 'text-gray-600'} />
            </button>
            <button
              className="p-3 mx-4 bg-gray-100 hover:bg-gray-200 rounded-full"
              onClick={togglePlayPause}
              disabled={isLoading || !currentTrack}
            >
              {isLoading ? (
                <Loader size={24} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} />
              )}
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={handleNextTrack}
              disabled={playlist.length === 0}
            >
              <SkipForward size={20} className={playlist.length === 0 ? 'text-gray-300' : 'text-gray-600'} />
            </button>
          </div>

          <div className="flex items-center w-1/4 justify-end">
            <Volume2 size={20} className="text-gray-600" />
            <input
              type="range"
              className="ml-2 w-24"
              min="0"
              max="100"
              defaultValue="50"
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.volume = e.target.value / 100;
                }
              }}
            />
          </div>
        </div>

        <div className="mt-2 max-w-4xl mx-auto">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs text-gray-500">
                {formatDuration(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {currentTrack?.duration || '0:00'}
              </div>
            </div>
            <div 
              ref={progressRef}
              className="flex h-2 bg-gray-200 rounded cursor-pointer"
              onClick={handleProgressClick}
              onMouseDown={(e) => {
                const handleMouseMove = (e) => handleProgressDrag(e);
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                
                handleProgressDrag(e);
              }}
            >
              <div
                style={{
                  width: `${currentTrack ? (currentTime / (currentTrack.duration_seconds || 1)) * 100 : 0}%`
                }}
                className="bg-blue-500 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNextTrack}
      />
    </div>
  );
};

export default MusicApp;