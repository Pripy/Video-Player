import React, {useEffect, useRef, useState} from "react"
import {ipcRenderer} from "electron" 
import path from "path"
import Slider from "rc-slider"
import functions from "../structures/functions"
import playButton from "../assets/icons/play.png"
import playButtonHover from "../assets/icons/play-hover.png"
import pauseButton from "../assets/icons/pause.png"
import pauseButtonHover from "../assets/icons/pause-hover.png"
import nextButton from "../assets/icons/next.png"
import nextButtonHover from "../assets/icons/next-hover.png"
import previousButton from "../assets/icons/previous.png"
import previousButtonHover from "../assets/icons/previous-hover.png"
import reverseButton from "../assets/icons/reverse.png"
import reverseButtonHover from "../assets/icons/reverse-hover.png"
import reverseActiveButton from "../assets/icons/reverse-active.png"
import speedButton from "../assets/icons/speed.png"
import speedButtonHover from "../assets/icons/speed-hover.png"
import speedActiveButton from "../assets/icons/speed-active.png"
import loopButton from "../assets/icons/loop.png"
import loopButtonHover from "../assets/icons/loop-hover.png"
import loopActiveButton from "../assets/icons/loop-active.png"
import abloopButton from "../assets/icons/abloop.png"
import abloopButtonHover from "../assets/icons/abloop-hover.png"
import abloopActiveButton from "../assets/icons/abloop-active.png"
import resetButton from "../assets/icons/clear.png"
import resetButtonHover from "../assets/icons/clear-hover.png"
import subtitleButton from "../assets/icons/sub.png"
import subtitleButtonHover from "../assets/icons/sub-hover.png"
import subtitleButtonActive from "../assets/icons/sub-active.png"
import fullscreenButton from "../assets/icons/fullscreen.png"
import fullscreenButtonHover from "../assets/icons/fullscreen-hover.png"
import volumeButton from "../assets/icons/volume.png"
import volumeButtonHover from "../assets/icons/volume-hover.png"
import volumeLowButton from "../assets/icons/volume-low.png"
import volumeLowButtonHover from "../assets/icons/volume-low-hover.png"
import muteButton from "../assets/icons/mute.png"
import muteButtonHover from "../assets/icons/mute-hover.png"
import rewindButton from "../assets/icons/rewind.png"
import rewindButtonHover from "../assets/icons/rewind-hover.png"
import fastForwardButton from "../assets/icons/fastforward.png"
import fastForwardButtonHover from "../assets/icons/fastforward-hover.png"
import "../styles/videoplayer.less"

const videoExtensions = [".mp4", ".mov", ".avi", ".flv", ".mkv", ".webm"]

const VideoPlayer: React.FunctionComponent = (props) => {
    const playerRef = useRef(null) as React.RefObject<HTMLDivElement>
    const videoRef = useRef(null) as React.RefObject<HTMLVideoElement>
    const speedBar = useRef(null) as React.RefObject<HTMLInputElement>
    const speedPopup = useRef(null) as React.RefObject<HTMLDivElement>
    const speedImg = useRef(null) as React.RefObject<HTMLImageElement>
    const [hover, setHover] = useState(false)
    const [playHover, setPlayHover] = useState(false)
    const [fastForwardHover, setFastforwardHover] = useState(false)
    const [rewindHover, setRewindHover] = useState(false)
    const [reverseHover, setReverseHover] = useState(false)
    const [speedHover, setSpeedHover] = useState(false)
    const [loopHover, setLoopHover] = useState(false)
    const [abloopHover, setABLoopHover] = useState(false)
    const [resetHover, setResetHover] = useState(false)
    const [subtitleHover, setSubtitleHover] = useState(false)
    const [volumeHover, setVolumeHover] = useState(false)
    const [fullscreenHover, setFullscreenHover] = useState(false)

    const initialState = {
        forwardSrc: null as any,
        reverseSrc: null as any,
        subtitleSrc: null as any,
        reverse: false,
        speed: 1,
        preservesPitch: true,
        progress: 0,
        duration: 0,
        prevVolume: 1,
        volume: 1,
        paused: false,
        subtitles: false,
        loop: false,
        abloop: false,
        loopStart: 0,
        loopEnd: 100
    }

    const [state, setState] = useState(initialState)

    useEffect(() => {
        const getOpenedFile = async () => {
            const file = await ipcRenderer.invoke("get-opened-file")
            if (file) upload(file)
        }
        getOpenedFile()
        const openFile = (event: any, file: string) => {
            if (file) upload(file)
        }
        const uploadFile = () => {
            upload()
        }
        const onClick = (event: any) => {
            if (speedPopup.current?.style.display === "flex") {
                if (!(speedPopup.current?.contains(event.target) || speedImg.current?.contains(event.target))) {
                    if (event.target !== speedPopup.current) speedPopup.current!.style.display = "none"
                }
            }
        }
        const keyDown = (event: KeyboardEvent) => {
            if (event.shiftKey) {
                event.preventDefault()
                speedBar.current!.step = "0.01"
            }
        }
        const keyUp = (event: KeyboardEvent) => {
            if (!event.shiftKey) {
                if (Number(speedBar.current!.value) % 0.5 !== 0) speedBar.current!.value = String(functions.round(Number(speedBar.current!.value), 0.5))
                speedBar.current!.step = "0.5"
            }
        }
        initState()
        ipcRenderer.on("open-file", openFile)
        ipcRenderer.on("upload-file", uploadFile)
        window.addEventListener("click", onClick)
        window.addEventListener("keydown", keyDown)
        window.addEventListener("keyup", keyUp)
        return () => {
            ipcRenderer.removeListener("open-file", openFile)
            ipcRenderer.removeListener("upload-file", uploadFile)
            window.removeEventListener("click", onClick)
            window.removeEventListener("keydown", keyDown)
            window.removeEventListener("keyup", keyUp)
            window.clearInterval()
        }
    }, [])

    const initState = async () => {
        let newState = {}
        const saved = await ipcRenderer.invoke("get-state")
        if (saved.speed !== undefined) {
            newState = {...newState, speed: saved.speed}
            videoRef.current!.playbackRate = saved.speed
        }
        if (saved.preservesPitch !== undefined) {
            newState = {...newState, preservesPitch: saved.preservesPitch}
            // @ts-ignore
            videoRef.current!.preservesPitch = saved.preservesPitch
        }
        if (saved.loop !== undefined) {
            newState = {...newState, loop: saved.loop}
            videoRef.current!.loop = saved.loop
        }
        setState((prev) => {
            return {...prev, ...newState}
        })
    }

    useEffect(() => {
        const timeUpdate = () => {
            let progress = 0
            let duration = 0
            if (videoRef.current) {
                progress = videoRef.current.currentTime / videoRef.current.playbackRate
                duration = videoRef.current.duration / videoRef.current.playbackRate
                if (state.abloop) {
                    const current = videoRef.current.currentTime
                    const start = state.reverse ? (videoRef.current.duration / 100) * (100 - state.loopStart) : (videoRef.current.duration / 100) * state.loopStart
                    const end = state.reverse ? (videoRef.current.duration / 100) * (100 - state.loopEnd) : (videoRef.current.duration / 100) * state.loopEnd
                    if (state.reverse) {
                        if (current > start || current < end) {
                            videoRef.current.currentTime = end
                            setState((prev) => {
                                return {...prev, progress: end}
                            })
                        }
                    } else {
                        if (current < start || current > end) {
                            videoRef.current.currentTime = start
                            setState((prev) => {
                                return {...prev, progress: start}
                            })
                        }
                    }
                }
            }
            setState((prev) => {
                return {...prev, progress, duration}
            })
        }
        if (state.subtitles) {
            videoRef.current!.textTracks[0].mode = "showing"
        } else {
            videoRef.current!.textTracks[0].mode = "hidden"
        }
        if (hover) {
            document.documentElement.style.setProperty("--subtitle-transform", "translateY(-80px)")
        } else {
            document.documentElement.style.setProperty("--subtitle-transform", "translateY(0)")
        }
        const onEnd = () => {
            setState((prev) => {
                return {...prev, paused: true}
            })
        }
        saveState()
        videoRef.current!.addEventListener("timeupdate", timeUpdate)
        videoRef.current!.addEventListener("ended", onEnd)
        return () => {
            videoRef.current!.removeEventListener("timeupdate", timeUpdate)
            videoRef.current!.removeEventListener("ended", onEnd)
        }
    })

    const refreshState = () => {
        speed(state.speed)
        preservesPitch(state.preservesPitch)
        if (state.abloop) abloop([state.loopStart, state.loopEnd])
    }

    const saveState = () => {
        ipcRenderer.invoke("save-state", {reverse: state.reverse, speed: state.speed, preservesPitch: state.preservesPitch, loop: state.loop, abloop: state.abloop, loopStart: state.loopStart, loopEnd: state.loopEnd})
    }

    const upload = async (file?: string) => {
        if (!file) file = await ipcRenderer.invoke("select-file")
        if (!file) return
        console.log(file)
        if (!videoExtensions.includes(path.extname(file))) return
        videoRef.current!.src = file
        videoRef.current!.currentTime = 0
        videoRef.current!.play()
        setState((prev) => {
            return {...prev, forwardSrc: file, reverseSrc: null, reverse: false, paused: false}
        })
        refreshState()
        ipcRenderer.invoke("extract-subtitles", file).then((subtitles) => {
            setState((prev) => {
                return {...prev, subtitleSrc: subtitles}
            })
        })
        ipcRenderer.invoke("get-reverse-src", file).then((reverseSrc) => {
            if (reverseSrc) {
                setState((prev) => {
                    return {...prev, reverseSrc}
                })
            }
        })
    }

    const play = () => {
        if (videoRef.current!.paused) {
            videoRef.current!.play()
            setState((prev) => {
                return {...prev, paused: false}
            })
        } else {
            videoRef.current!.pause()
            setState((prev) => {
                return {...prev, paused: true}
            })
        }
    }

    const reverse = async () => {
        if (!state.reverseSrc) {
            videoRef.current?.pause()
            setState((prev) => {
                return {...prev, paused: true}
            })
            ipcRenderer.invoke("reverse-dialog", true)
            await new Promise<void>((resolve) => {
                ipcRenderer.invoke("reverse-video", state.forwardSrc).then((reversed) => {
                    ipcRenderer.invoke("reverse-dialog", false)
                    let percent = videoRef.current!.currentTime / videoRef.current!.duration
                    const newTime = (1-percent) * videoRef.current!.duration
                    videoRef.current!.src = reversed
                    videoRef.current!.currentTime = newTime
                    videoRef.current!.play()
                    refreshState()
                    setState((prev) => {
                        return {...prev, reverseSrc: reversed, reverse: true, paused: false}
                    })
                    resolve()
                })
            })
            return
        }
        if (state.reverse) {
            let percent = videoRef.current!.currentTime / videoRef.current!.duration
            const newTime = (1-percent) * videoRef.current!.duration
            videoRef.current!.src = state.forwardSrc
            videoRef.current!.currentTime = newTime
            videoRef.current!.play()
            refreshState()
            setState((prev) => {
                return {...prev, reverse: false}
            })
        } else {
            let percent = videoRef.current!.currentTime / videoRef.current!.duration
            const newTime = (1-percent) * videoRef.current!.duration
            videoRef.current!.src = state.reverseSrc
            videoRef.current!.currentTime = newTime
            videoRef.current!.play()
            refreshState()
            setState((prev) => {
                return {...prev, reverse: true}
            })
        }
        setState((prev) => {
            return {...prev, paused: false}
        })
    }

    const speed = (value?: number | string) => {
        videoRef.current!.playbackRate = Number(value)
        setState((prev) => {
            return {...prev, speed: Number(value)}
        })
    }

    const preservesPitch = (value?: boolean) => {
        const preservesPitch = value !== undefined ? value : !state.preservesPitch
        // @ts-ignore
        videoRef.current!.preservesPitch = preservesPitch
        setState((prev) => {
            return {...prev, preservesPitch}
        })
    }

    const seek = (position: number) => {
        const progress = state.reverse ? (videoRef.current!.duration / 100) * (100 - position) : (videoRef.current!.duration / 100) * position
        videoRef.current!.currentTime = progress
        setState((prev) => {
            return {...prev, progress}
        })
    }

    const volume = (value: number) => {
        videoRef.current!.volume = value
        setState((prev) => {
            return {...prev, volume: value, prevVolume: value}
        })
    }

    const volumeIcon = () => {
        if (state.volume > 0.5) {
            if (volumeHover) return volumeButtonHover
            return volumeButton
        } else if (state.volume > 0) {
            if (volumeHover) return volumeLowButtonHover
            return volumeLowButton
        } else {
            if (volumeHover) return muteButtonHover
            return muteButton
        }
    }

    const mute = () => {
        if (videoRef.current!.volume > 0) {
            videoRef.current!.volume = 0
            setState((prev) => {
                return {...prev, volume: 0}
            })
        } else {
            const newVol = state.prevVolume ? state.prevVolume : 1
            videoRef.current!.volume = newVol
            setState((prev) => {
                return {...prev, volume: newVol}
            })
        }
    }

    const fullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
        } else {
            playerRef.current!.requestFullscreen()
        }
    }

    const loop = (value?: boolean) => {
        const toggle = value !== undefined ? value : !state.loop
        videoRef.current!.loop = toggle
        setState((prev) => {
            return {...prev, loop: toggle}
        })
    }

    const reset = () => {
        const {forwardSrc, reverseSrc, subtitleSrc, subtitles, volume, prevVolume} = state
        videoRef.current!.playbackRate = 1
        // @ts-ignore
        videoRef.current!.preservesPitch = true
        videoRef.current!.src = forwardSrc
        videoRef.current!.currentTime = 0
        videoRef.current!.play()
        setState(initialState)
        setState((prev) => {
            return {...prev, forwardSrc, reverseSrc, subtitleSrc, subtitles, volume, prevVolume}
        })
    }

    const subtitles = () => {
        setState((prev) => {
            return {...prev, subtitles: !prev.subtitles}
        })
    }

    const abloop = (value: number[]) => {
        setState((prev) => {
            return {...prev, loopStart: value[0], loopEnd: value[1]}
        })
    }

    const toggleAB = (value?: boolean) => {
        const abloop = value !== undefined ? value : !state.abloop
        setState((prev) => {
            return {...prev, abloop}
        })
    }

    const rewind = () => {
        let newTime = state.reverse ? videoRef.current!.currentTime + 10 : videoRef.current!.currentTime - 10
        if (newTime < 0) newTime = 0
        if (newTime > videoRef.current!.duration) newTime = videoRef.current!.duration
        videoRef.current!.currentTime = newTime
        setState((prev) => {
            return {...prev, progress: newTime}
        })
    }

    const fastforward = () => {
        let newTime = state.reverse ? videoRef.current!.currentTime - 10 : videoRef.current!.currentTime + 10
        if (newTime < 0) newTime = 0
        if (newTime > videoRef.current!.duration) newTime = videoRef.current!.duration
        videoRef.current!.currentTime = newTime
        setState((prev) => {
            return {...prev, progress: newTime}
        })
    }

    return (
        <main className="video-player" ref={playerRef}>
            <video className="video" ref={videoRef}>
                <track kind="subtitles" src={state.subtitleSrc}></track>
            </video>
            <div className={hover ? "video-controls visible" : "video-controls"} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="control-row">
                    <p className="control-text">{functions.formatSeconds(state.reverse ? state.duration - state.progress : state.progress)}</p>
                    <div className="progress-container">
                        <Slider className="progress-slider" onChange={(value) => seek(value)} min={0} max={100} step={1} value={state.reverse ? ((1 - state.progress / state.duration) * 100) : (state.progress / state.duration * 100)}/>
                        <Slider.Range className="ab-slider" min={0} max={100} value={[state.loopStart, state.loopEnd]} onChange={(value) => abloop(value)} style={({display: `${state.abloop ? "flex" : "none"}`})}/>
                    </div>
                    <p className="control-text">{functions.formatSeconds(state.duration)}</p>
                </div>
                <div className="control-row">
                    <img className="control-button" src={reverseHover ? reverseButtonHover : (state.reverse ? reverseActiveButton : reverseButton)} onClick={() => reverse()} onMouseEnter={() => setReverseHover(true)} onMouseLeave={() => setReverseHover(false)}/>
                    <div className="speed-popup-container" ref={speedPopup} style={({display: "none"})}>
                            <div className="speed-popup">
                                <input type="range" ref={speedBar} onChange={(event) => speed(event.target.value)} min="0.5" max="4" step="0.5" value={state.speed} className="speed-bar"/>
                                <div className="speed-checkbox-container">
                                <p className="speed-text">Pitch?</p><input type="checkbox" checked={!state.preservesPitch} onChange={() => preservesPitch()} className="speed-checkbox"/>
                                </div>
                            </div>
                        </div>
                    <img className="control-button" src={speedHover ? speedButtonHover : (state.speed !== 1 ? speedActiveButton : speedButton)} ref={speedImg} onClick={() => speedPopup.current!.style.display === "flex" ? speedPopup.current!.style.display = "none" : speedPopup.current!.style.display = "flex"} onMouseEnter={() => setSpeedHover(true)} onMouseLeave={() => setSpeedHover(false)}/>
                    <img className="control-button" src={loopHover ? loopButtonHover : (state.loop ? loopActiveButton : loopButton)} onClick={() => loop()} onMouseEnter={() => setLoopHover(true)} onMouseLeave={() => setLoopHover(false)}/>
                    <img className="control-button" src={abloopHover ? abloopButtonHover : (state.abloop ? abloopActiveButton : abloopButton)} onClick={() => toggleAB()} onMouseEnter={() => setABLoopHover(true)} onMouseLeave={() => setABLoopHover(false)}/>
                    <img className="control-button" src={resetHover ? resetButtonHover : resetButton} onClick={() => reset()} onMouseEnter={() => setResetHover(true)} onMouseLeave={() => setResetHover(false)}/>
                    <img className="control-button rewind-button" src={rewindHover ? rewindButtonHover : rewindButton} onClick={() => rewind()} onMouseEnter={() => setRewindHover(true)} onMouseLeave={() => setRewindHover(false)}/>
                    <img className="control-button play-button" src={playHover ? (state.paused ? playButtonHover : pauseButtonHover) : (state.paused ? playButton : pauseButton)} onClick={() => play()} onMouseEnter={() => setPlayHover(true)} onMouseLeave={() => setPlayHover(false)}/>
                    <img className="control-button rewind-button" src={fastForwardHover ? fastForwardButtonHover : fastForwardButton} onClick={() => fastforward()} onMouseEnter={() => setFastforwardHover(true)} onMouseLeave={() => setFastforwardHover(false)}/>
                    <img className="control-button" src={subtitleHover ? subtitleButtonHover : (state.subtitles ? subtitleButtonActive : subtitleButton)} onClick={() => subtitles()} onMouseEnter={() => setSubtitleHover(true)} onMouseLeave={() => setSubtitleHover(false)}/>
                    <img className="control-button" src={fullscreenHover ? fullscreenButtonHover : fullscreenButton} onClick={() => fullscreen()} onMouseEnter={() => setFullscreenHover(true)} onMouseLeave={() => setFullscreenHover(false)}/>
                    <img className="control-button" src={volumeIcon()} onClick={() => mute()} onMouseEnter={() => setVolumeHover(true)} onMouseLeave={() => setVolumeHover(false)}/>
                    <Slider className="volume-slider" onChange={(value) => volume(value)} min={0} max={1} step={0.01} value={state.volume}/>
                </div>
            </div>
        </main>
    )
}

export default VideoPlayer