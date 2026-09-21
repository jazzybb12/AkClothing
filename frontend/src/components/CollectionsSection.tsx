import Link from "next/link";
import {Collection} from "@/lib/types";
export default function CollectionsSection({collections,eyebrow="The curated edit",heading="A softer way to stand out."}:{collections:Collection[];eyebrow?:string;heading?:string}){
 if(!collections.length)return null;
 return <section className="mt-16"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="rang-section-tag">{eyebrow}</p><h2>{heading}</h2></div><Link className="text-xs" href="/shop">Shop all ↗</Link></div><div className="grid gap-6 sm:grid-cols-3">{collections.map((c,i)=><Link key={c.id} href={`/collections/${c.slug}`} className="group"><div className="dune-collection-art"><span className="absolute left-4 top-4 z-10 text-xs">{String(i+1).padStart(2,'0')}</span><img src={c.imageUrl||'/concepts/dune-garment.svg'} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/></div><div className="mt-4 flex justify-between gap-4"><h3 className="text-xl">{c.name}</h3><span>↗</span></div>{c.description&&<p className="mt-2 text-xs text-ink-soft">{c.description}</p>}</Link>)}</div></section>;
}
