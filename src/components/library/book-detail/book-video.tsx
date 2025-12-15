"use client"

interface Props {
  videoUrl: string
  title: string
}

export default function BookVideo({ videoUrl, title }: Props) {
  return (
    <div className="book-video-container">
      <h3 className="mb-4">Book Preview</h3>
      <div className="book-video-wrapper">
        <iframe
          src={videoUrl}
          title={`${title} - Video Preview`}
          className="book-video-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
