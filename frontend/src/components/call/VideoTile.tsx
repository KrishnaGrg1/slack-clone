import { useEffect, useRef } from 'react'

export default function VideoTile({
  stream,
  label,
  muted = false,
}: {
  stream: MediaStream | null
  label: string
  muted?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])

  return (
    <div className="relative aspect-video w-48 overflow-hidden rounded-lg bg-[#16161F]">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      <span className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1.5 text-[10px] text-white">
        {label}
      </span>
    </div>
  )
}
