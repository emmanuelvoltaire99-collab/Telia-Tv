/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Sliders } from 'lucide-react';
import { PodcastEpisode } from '../types.ts';

interface AudioPlayerProps {
  episode: PodcastEpisode;
  onClose?: () => void;
}

export default function AudioPlayer({ episode, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create new audio element when episode changes
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(episode.audioUrl);
    audioRef.current = audio;
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Auto play when loaded
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.log("Auto-play blocked or audio load error:", err));

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [episode]);

  // Adjust volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Adjust play speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error(err));
    }
  };

  const handleSeeking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const cycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const currentIdx = rates.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  return (
    <div id="audio-player-container" className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-neutral-800 text-white px-4 py-3 md:py-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Info Left */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <img 
            id="audio-episode-thumbnail"
            src={episode.imageUrl} 
            alt={episode.titleFr} 
            className="w-12 h-12 rounded object-cover border border-neutral-800 flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 id="audio-episode-title" className="text-sm font-medium text-neutral-100 truncate">{episode.titleFr}</h4>
            <p id="audio-episode-guests" className="text-xs text-neutral-400 truncate">
              {episode.guests.length > 0 ? `Invités: ${episode.guests.join(', ')}` : 'Mangwa Thérèse'}
            </p>
          </div>
        </div>

        {/* Controls Middle */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          <div className="flex items-center gap-4">
            <button 
              id="audio-btn-rewind"
              onClick={() => handleSkip(-15)} 
              className="text-neutral-400 hover:text-white transition"
              title="Reculer de 15s"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              id="audio-btn-play-toggle"
              onClick={togglePlay} 
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </button>
            <button 
              id="audio-btn-forward"
              onClick={() => handleSkip(15)} 
              className="text-neutral-400 hover:text-white transition"
              title="Avancer de 15s"
            >
              <FastForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full text-xs text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <input 
              id="audio-seek-slider"
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeeking}
              className="flex-grow h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neutral-200"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extras Right */}
        <div className="flex items-center justify-end gap-4 w-full md:w-1/4">
          {/* Speed badge */}
          <button 
            id="audio-btn-speed"
            onClick={cycleSpeed}
            className="text-xs font-semibold px-2 py-1 border border-neutral-700 hover:border-neutral-500 rounded text-neutral-300 hover:text-white min-w-[50px] text-center"
          >
            {playbackRate}x
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-2 text-neutral-400 hover:text-white group">
            <button 
              id="audio-btn-mute"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-neutral-900 rounded"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              id="audio-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? '0' : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 md:w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Close button */}
          {onClose && (
            <button 
              id="audio-btn-close"
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition"
            >
              Fermer
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
