import { useNavigate } from "react-router-dom"
import { useCallback } from "react";

export default function AlbumItem({image, name, desc, id}) {

    const navigate = useNavigate();

    const handleNavigate = useCallback(() => {
        navigate(`/album/${id}`)
    }, [id, navigate])

  return (
    <div onClick={handleNavigate} className="min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26]">
        <img src={image} alt="Album cover" />
        <p className="font-bold mt-2 mb-1">{name}</p>
        <p className="text-slate-200 text-sm">{desc}</p>
    </div>
  )
}
