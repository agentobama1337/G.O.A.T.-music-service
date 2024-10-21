export default function TrackSearchResult({ track }) {
  return (
    <div className="flex items-center mb-4 p-2 bg-gray-50 rounded-lg shadow">
      <img 
        src={track.albumUrl} 
        alt={track.title} 
        className="w-16 h-16 mr-4 rounded-lg shadow-sm"
      />
      <div>
        <h3 className="text-md font-semibold">{track.title}</h3>
        <p className="text-gray-600">{track.artist}</p>
      </div>
    </div>
  );
}
