"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Banner } from "@/lib/types";
const fallback: Banner = { id:"dune-introduction", eyebrow:"THE MODERN HERITAGE EDIT", heading:"Rooted in warmth.", subtext:"Earth-toned stories, flowing silhouettes, and a little everyday ceremony. Dress at your own pace.", ctaLabel:"Explore the collection", ctaHref:"/shop", imageUrl:null, gradientKey:"brand",position:0,active:true };
export default function HeroCarousel({banners, showFallback = false}: {banners:Banner[];showFallback?:boolean}) {
 const [active,setActive]=useState(0); const [paused,setPaused]=useState(false); const [reduced,setReduced]=useState(true);
 useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update);},[]);
 useEffect(()=>{if(banners.length<2||paused||reduced)return;const timer=setInterval(()=>setActive(i=>(i+1)%banners.length),5000);return()=>clearInterval(timer);},[banners.length,paused,reduced]);
 const slides=banners.length?banners:showFallback?[fallback]:[];if(!slides.length)return null;const slide=slides[active%slides.length];
 return <section className="dune-hero" style={{minHeight:slide.height??560}} aria-label="Featured collections">
  <div className="dune-stage" style={{backgroundColor:slide.accentColor??undefined}}>
   {slide.imageUrl?<Image src={slide.imageUrl} alt="" fill priority sizes="(max-width: 760px) 100vw, 50vw" style={{objectFit:"cover",objectPosition:`${slide.imagePosition??50}% center`,transform:`perspective(900px) rotateY(${slide.imageRotation??0}deg) scale(${slide.imageRotation?1.2:1})`}}/>:<><div className="dune-orb"/><Image src="/concepts/dune-garment.svg" alt="Illustrated everyday shirt" fill priority className="dune-garment" style={{objectFit:"contain",transform:`perspective(900px) rotateY(${slide.imageRotation??-12}deg) rotate(-7deg)`}}/><span className="dune-art-label">FORM / FABRIC / FEELING</span></>}
  </div>
  <div className="dune-hero-copy"><p className="rang-section-tag">{slide.eyebrow}</p><h1>{slide.heading}</h1>{slide.subtext&&<p className="dune-description">{slide.subtext}</p>}{slide.ctaLabel&&slide.ctaHref&&<Link className="rang-btn-primary" href={slide.ctaHref}>{slide.ctaLabel}<span aria-hidden="true"> ↗</span></Link>}
   {slides.length>1&&<div className="dune-slide-controls">{slides.map((b,i)=><button key={b.id} aria-label={`Show banner ${i+1}`} aria-pressed={active%slides.length===i} onClick={()=>setActive(i)}>{String(i+1).padStart(2,"0")}</button>)}</div>}
  </div>
 </section>;
}

