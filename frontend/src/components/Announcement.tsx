"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
export default function Announcement() {
 const [settings,setSettings]=useState<{announcementText?:string|null;whatsappNumber?:string|null}>({});const [paused,setPaused]=useState(false);
 useEffect(()=>{apiFetch<typeof settings>("/settings").then(setSettings).catch(()=>{});},[]);
 const number=settings.whatsappNumber?.replace(/\D/g,"");
 return <div className="dune-announcement"><div className="overflow-hidden flex-1"><div className="ribbon-track inline-flex w-max" style={{animationPlayState:paused?"paused":undefined}}>{[0,1].map(i=><div key={i} aria-hidden={i===1?true:undefined} className="flex shrink-0 items-center gap-10 px-5"><span>{settings.announcementText||"AK.SHOP · THE MODERN HERITAGE EDIT"}</span><span aria-hidden="true">✳</span>{number?<a tabIndex={i===1?-1:0} href={`https://wa.me/${number}`} target="_blank" rel="noreferrer">Order on WhatsApp +{number} ↗</a>:<span>Discover your everyday essentials</span>}<span aria-hidden="true">✳</span></div>)}</div></div></div>;
}
