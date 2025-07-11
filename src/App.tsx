import VideoPlayer from './lib/VideoPlayer'
import video from './assets/video.mp4'
import poster from './assets/poster2.png'

function App() {

  return (
    <div className="bg-[#181818] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-4">
        <VideoPlayer poster={poster} src='http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' muted={false}/>
        {/* <VideoPlayer  src={video} poster={poster} muted={false}/> */}

      </div>
    </div>
  )
}

export default App
