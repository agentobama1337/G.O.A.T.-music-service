import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const AlbumView = ({ browseId, onBackClick, onTrackSelect, api }) => {
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumThumbnail, setAlbumThumbnail] = useState('');
  const [albumInfo, setAlbumInfo] = useState(null);

  useEffect(() => {
    const fetchAlbumTracks = async () => {
      try {
        const response = await api.get('/api/get_album', {
          params: { albumID: browseId } 
        });

        if (response.data.success && response.data.response) {
          // Сохраняем информацию об альбоме
          setAlbumInfo(response.data.response);
          // Добавляем к каждому треку информацию об альбоме
          const tracksWithAlbumInfo = response.data.response.tracks.map(track => ({
            ...track,
            albumId: browseId,
            albumTitle: response.data.response.title,
            thumbnails: response.data.response.thumbnails // Используем обложку альбома
          }));
          setAlbumTracks(tracksWithAlbumInfo);
          setAlbumThumbnail(response.data.response.thumbnails[response.data.response.thumbnails.length - 1].url);
        }
      } catch (error) {
        console.error('Error fetching album:', error);
        setAlbumTracks([]);
        setAlbumThumbnail('');
      } finally {
        setLoading(false);
      }
    };

    if (browseId) {
      fetchAlbumTracks();
    }
  }, [browseId, api]);

  const handleTrackSelect = (track) => {
    // Передаем только треки из текущего альбома
    onTrackSelect(track, albumTracks);
  };

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

      {/* Album Info Header */}
      {albumInfo && (
        <div className="flex items-start mb-6">
          {albumThumbnail && (
            <img
              src={albumThumbnail}
              alt={albumInfo.title}
              className="w-40 h-40 rounded-lg shadow-lg"
            />
          )}
          <div className="ml-6">
            <h1 className="text-2xl font-bold">{albumInfo.title}</h1>
            {albumInfo.artist && (
              <p className="text-gray-600 text-lg">{albumInfo.artist}</p>
            )}
            {albumInfo.year && (
              <p className="text-gray-500">{albumInfo.year}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {albumTracks.map((track, index) => (
          <div
            key={track.videoId || index}
            onClick={() => handleTrackSelect(track, index)}
            className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div className="w-8 text-gray-400">{index + 1}</div>
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