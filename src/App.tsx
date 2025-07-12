import VideoPlayer from './lib/VideoPlayer'



function App() {

  return (
    <div className="bg-[#181818] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-4">
        <VideoPlayer src='http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' poster="/assets/poster.png" muted={false}/>
        {/* <VideoPlayer src={video} poster="/assets/poster.png" muted={false}/> */}

      </div>
    </div>
  )
}

export default App
