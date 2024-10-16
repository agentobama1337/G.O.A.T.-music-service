import { createContext, useEffect, useRef, useState } from "react";
import { songsData } from "../assets/assets";

export const PlayerContext = createContext(); 

const PlayerContextProvider = (props) => {

    const audioRef = useRef();
    const seekBg = useRef();
    const seekBar = useRef();

    const [ track, setTrack ] = useState(songsData[0]);
    const [ playStatus, setPlayStatus ] = useState(false);
    const [ time, setTime ] = useState({
        currentTime: {
            second: 0,
            minute: 0
        },
        totalDuration: {
            second: 0,
            minute: 0
        }
    })

    const controlBar = async (e) => {
        audioRef.current.currentTime = ((e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration)
    }

    const play = () => {
        audioRef.current.play();
        setPlayStatus(true);
    }


    const pause = () => {
        audioRef.current.pause();
        setPlayStatus(false);
    }


    const playWithId = async (id) => {
        await setTrack(songsData[id]);
        await audioRef.current.play();
        setPlayStatus(true);
    }

    const previousSong = async () => {
        if (track.id > 0) {
            await setTrack(songsData[track.id - 1]);
            await audioRef.current.play();
            setPlayStatus(true)
        }
    }

    const nextSong = async () => {
        if (track.id < songsData.length - 1) {
            await setTrack(songsData[track.id + 1]);
            await audioRef.current.play();
            setPlayStatus(true)
        }
    }

    useEffect(() => {
        const updateProgress = () => {
            if (audioRef.current && audioRef.current.duration) {
                seekBar.current.style.width = `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%`;
                setTime({
                    currentTime: {
                        second: Math.floor(audioRef.current.currentTime % 60),
                        minute: Math.floor(audioRef.current.currentTime / 60),
                    },
                    totalDuration: {
                        second: Math.floor(audioRef.current.duration % 60),
                        minute: Math.floor(audioRef.current.duration / 60),
                    },
                });
                requestAnimationFrame(updateProgress); // Запуск на каждом кадре
            }
        };
    
        if (audioRef.current) {
            requestAnimationFrame(updateProgress); // Запуск плавного обновления
        }
    }, [audioRef]);
    


    const contextValue = {
        audioRef,
        seekBg,
        seekBar,
        track, setTrack,
        playStatus, setPlayStatus,
        time, setTime,
        play,
        pause,
        playWithId,
        previousSong, nextSong,
        controlBar
    }

    return (
        <PlayerContext.Provider value={contextValue}>
            { props.children }
        </PlayerContext.Provider>
    )
}

export default PlayerContextProvider;