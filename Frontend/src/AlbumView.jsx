import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const AlbumView = ({ browseId, onBackClick, onTrackSelect, api }) => {
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumTumbnail, setAlbumTumbnail] = useState('');

  useEffect(() => {
    const fetchAlbumTracks = async () => {
      try {
        const response = await api.get('/api/get_album', {
          params: { albumID: browseId } 
        });

        console.log(response)

        if (response.data.success && response.data.response) {
          setAlbumTracks(response.data.response.tracks);
          setAlbumTumbnail(response.data.response.thumbnails[0].url)
        }
      } catch (error) {
        console.error('Error fetching album:', error);
        setAlbumTracks([]);
        setAlbumTumbnail('');
      } finally {
        setLoading(false);
      }
    };

    if (browseId) {
      fetchAlbumTracks();
    }
  }, [browseId, api]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <button
        onClick={onBackClick}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Search
      </button>

      <div className="space-y-2">
        {albumTracks.map((track, index) => (
          <div
            key={track.videoId || index}
            onClick={() => onTrackSelect(track)}
            className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div className="w-8 text-gray-400">{index + 1}</div>
            {albumTumbnail && (
              <img
                src={albumTumbnail}
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
            <div className="text-sm text-gray-500">
              {track.duration || '0:00'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumView;