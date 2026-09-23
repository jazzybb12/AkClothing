"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import AdminProductList from "@/components/admin/AdminProductList";
import {apiFetch} from "@/lib/api";
import {Category} from "@/lib/types";
export default function Page(){
 const {id}=useParams<{id:string}>();
 const [category,setCategory]=useState<Category|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;setCategory(null);setError("");apiFetch<Category[]>("/categories").then(items=>{if(!active)return;const found=items.find(c=>c.id===id);if(found)setCategory(found);else setError("Category not found.");}).catch(()=>{if(active)setError("Could not load category. Please refresh.");});return()=>{active=false};},[id]);
 return <div><Link href="/admin/categories" className="mb-5 inline-block text-sm underline">← Back to categories</Link>{error?<p role="alert">{error}</p>:category?<AdminProductList key={id} categoryId={id} title={category.name+" products"}/>:<p>Loading category...</p>}</div>;
}
