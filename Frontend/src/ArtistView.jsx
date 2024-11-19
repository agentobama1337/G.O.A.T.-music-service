import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import AlbumView from './AlbumView';

const ArtistView = ({ browseId, onBackClick, onTrackSelect, api }) => {
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [view, setView] = useState('artist'); // 'artist' or 'album'

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const response = await api.get('/api/get_artist', {
          params: { artistID: browseId }
        });

        console.log(response)

        if (response.data.success && response.data.response) {
          setArtistData(response.data.response);
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
      } finally {
        setLoading(false);
      }
    };

    if (browseId) {
      fetchArtistData();
    }
  }, [browseId, api]);

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    setView('album');
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'album' && selectedAlbum) {
    return (
      <div className="flex-1 overflow-y-auto">
        <AlbumView
          browseId={selectedAlbum.browseId}
          onBackClick={() => {
            setView('artist');
            setSelectedAlbum(null);
          }}
          onTrackSelect={onTrackSelect}
          api={api}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with background image */}
      <div 
        className="h-48 bg-gradient-to-b from-blue-900 to-gray-900 relative"
        style={{
          backgroundImage: artistData?.thumbnails?.[artistData?.thumbnails.length - 1]?.url ? 
            `url(${artistData.thumbnails[artistData?.thumbnails.length - 1].url})` : 
            'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50">
          <div className="p-4">
            <button
              onClick={onBackClick}
              className="flex items-center text-white hover:text-gray-200"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <h1 className="text-4xl font-bold text-white">{artistData?.name}</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Popular Tracks Section */}
        {artistData?.songs?.results?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Popular Tracks</h2>
            <div className="space-y-2">
              {artistData.songs.results.map((track, index) => (
                <div
                  key={track.videoId}
                  onClick={() => onTrackSelect(track)}
                  className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-8 text-gray-400">{index + 1}</div>
                  {track.thumbnails?.[0]?.url && (
                    <img
                      src={track.thumbnails[0].url}
                      alt={track.title}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div className="ml-3 flex-1">
                    <div className="font-semibold">{track.title}</div>
                    <div className="text-sm text-gray-600">
                      {track.artists?.map(artist => artist.name).join(', ')}
                    </div>
                  </div>
                  {track.isExplicit && (
                    <span className="px-2 py-1 text-xs bg-gray-200 rounded mr-2">
                      E
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Albums Section */}
        {artistData?.albums?.results?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artistData.albums.results.map((album) => (
                <div
                  key={album.browseId}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleAlbumClick(album)}
                >
                  {album.thumbnails?.[album.thumbnails.length - 1]?.url && (
                    <img
                      src={album.thumbnails[album.thumbnails.length - 1].url}
                      alt={album.title}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="font-medium truncate">{album.title}</div>
                  <div className="text-sm text-gray-600">{album.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Singles Section */}
        {artistData?.singles?.results?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Singles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artistData.singles.results.map((single) => (
                <div
                  key={single.browseId}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleAlbumClick(single)}
                >
                  {single.thumbnails?.[single.thumbnails.length - 1]?.url && (
                    <img
                      src={single.thumbnails[single.thumbnails.length - 1].url}
                      alt={single.title}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="font-medium truncate">{single.title}</div>
                  <div className="text-sm text-gray-600">{single.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistView;