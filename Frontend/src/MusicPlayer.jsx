import { Play, Pause, SkipBack, SkipForward, Volume2, Loader } from 'lucide-react';

const MusicPlayer = ({
  currentTrack,
  isPlaying,
  isLoading,
  playlist,
  currentTime,
  audioRef,
  progressRef,
  togglePlayPause,
  handlePrevTrack,
  handleNextTrack,
  handleProgressClick,
  handleProgressDrag,
  getThumbnailUrl,
  getArtistNames,
  formatDuration
}) => {
  // Helper function to apply disabled styling
  const getControlStyle = (disabled) => 
    disabled ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="bg-white border-t p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Track Info */}
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

        {/* Playback Controls */}
        <div className="flex items-center justify-center w-2/4">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={handlePrevTrack}
            disabled={playlist.length === 0}
          >
            <SkipBack size={20} className={getControlStyle(playlist.length === 0)} />
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
            <SkipForward size={20} className={getControlStyle(playlist.length === 0)} />
          </button>
        </div>

        {/* Volume Control */}
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

      {/* Progress Bar */}
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
  );
};

export default MusicPlayer;