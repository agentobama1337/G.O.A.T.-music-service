
const AUTH_URL = "https://accounts.spotify.com/authorize?client_id=cdcc0f73d85f4256bb61e5db41276e86&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state"

export default function Login() {
  return (
    <div className="flex justify-center items-center h-screen">
      <a className="bg-green-500 px-4 py-4 rounded-xl font-semibold text-xl text-black" href={AUTH_URL}>Login with Spotify</a>
    </div>
  )
}
