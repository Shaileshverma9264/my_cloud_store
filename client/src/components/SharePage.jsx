import React,{ useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SharePage({ token }) {
  const [state, setState] = useState({loading:true});
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_public_share', { p_token: token });
      if (error || !data?.length) return setState({loading:false,error:'This link is invalid or expired.'});
      setState({loading:false, share:data[0]});
    })();
  }, [token]);

  async function download() {
    try {
      const { data, error } = await supabase.functions.invoke('share-download', { body: { token } });
      if (error) throw error;
      window.location.href = data.url;
    } catch(e) { alert(e.message); }
  }

  if (state.loading) return <div className="share-page">Loading...</div>;
  if (state.error) return <div className="share-page"><div className="auth-card"><h2>Link unavailable</h2><p>{state.error}</p></div></div>;
  return <div className="share-page"><div className="auth-card">
    <div className="brand-big">📄</div>
    <h2>{state.share.original_name}</h2>
    <p className="muted">Shared file · {Math.round(state.share.size_bytes / 1024)} KB</p>
    <button onClick={download}>Download file</button>
  </div></div>;
}