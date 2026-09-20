"use client";

import { useEffect, useState } from "react";

type User = { id:string; name:string; email:string; role:"OWNER"|"TEACHER" };
type Dashboard = { students:number; classes:number; teachers:number; expected:number; collected:number; pending:number; todayCollection:number; recentPayments:any[] };

export default function Home() {
  const [user,setUser]=useState<User|null>(null);
  const [data,setData]=useState<Dashboard|null>(null);

  async function load() {
    const me=await fetch("/api/me");
    if (!me.ok) {
      window.location.href = "/login";
      return;
    }
    const m=await me.json();
    if (m.user.role === "OWNER") {
      window.location.href = "/owner";
      return;
    }
    if (m.user.role === "TEACHER") {
      window.location.href = "/teacher";
      return;
    }
    setUser(m.user);
    const d=await fetch("/api/dashboard"); if(d.ok) setData(await d.json());
  }
  useEffect(()=>{load()},[]);

  async function signOut(){await fetch("/api/auth/logout",{method:"POST"});setUser(null);setData(null);}

  if(!user) return null;

  return <><nav><div><strong>Maktab Management</strong> <span className="muted" style={{color:"#cbd5e1"}}>{user.role}</span></div><div><button onClick={signOut} className="secondary">Logout</button></div></nav>
  <main className="container">
    <h1>Dashboard</h1>
    <p className="muted">Welcome, {user.name}.</p>
    {data && <div className="grid grid4">
      <div className="card">Students<div className="stat">{data.students}</div></div>
      <div className="card">Classes<div className="stat">{data.classes}</div></div>
      {user.role==="OWNER" && <div className="card">Teachers<div className="stat">{data.teachers}</div></div>}
      <div className="card">Today’s collection<div className="stat">₹{data.todayCollection}</div></div>
      <div className="card">Expected fees<div className="stat">₹{data.expected}</div></div>
      <div className="card">Collected<div className="stat">₹{data.collected}</div></div>
      <div className="card">Pending<div className="stat">₹{data.pending}</div></div>
    </div>}
    <div className="card" style={{marginTop:16}}>
      <h2>Next modules</h2>
      <p className="muted">Students, classes, fee collection, payment allocation, receipts, teacher access control and reporting APIs are included in the backend foundation. UI screens can be expanded module-by-module.</p>
    </div>
  </main></>;
}
