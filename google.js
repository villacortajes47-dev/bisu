import {getToken} from 'next-auth/jwt';

export class ApiError extends Error {
  constructor(message, status=400) {super(message);this.status=status;}
}

export async function accessToken(req) {
  const jwt=await getToken({req, secret:process.env.NEXTAUTH_SECRET});
  if (!jwt || !process.env.ADMIN_EMAIL || jwt.email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) {
    throw new ApiError('Please log in using the authorized instructor Google account.',401);
  }
  if (jwt.googleAccessToken && Date.now()/1000 < (Number(jwt.googleAccessExpiry)||0)-90) return jwt.googleAccessToken;
  if (!jwt.googleRefreshToken) throw new ApiError('Google session expired. Sign out, then sign in again.',401);
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:jwt.googleRefreshToken,grant_type:'refresh_token'}),
    cache:'no-store'
  });
  const data=await resp.json();
  if (!resp.ok || !data.access_token) throw new ApiError('Could not refresh Google access. Please sign in again.',401);
  // Refresh credentials remain in the encrypted HttpOnly session JWT. For this small starter,
  // an expired access token is refreshed per request rather than storing a rotated token.
  return data.access_token;
}

export async function googleJson(token,path,options={}) {
  const url = `https://classroom.googleapis.com/v1/${path.replace(/^\//,'')}`;
  const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})},cache:'no-store'});
  const raw=await response.text();
  let data={};try{data=raw?JSON.parse(raw):{};}catch{data={};}
  if (!response.ok) {
    const message=data.error?.message||`Google Classroom returned HTTP ${response.status}`;
    throw new ApiError(message,response.status);
  }
  return data;
}

export async function googleList(token,path,field) {
  let pageToken=''; const output=[];
  for(let p=0;p<15;p++) {
    const join=path.includes('?')?'&':'?';
    const url=path+(pageToken?join+'pageToken='+encodeURIComponent(pageToken):'');
    const data=await googleJson(token,url);
    output.push(...(data[field]||[]));
    if(!data.nextPageToken) return output;
    pageToken=data.nextPageToken;
  }
  throw new ApiError('Too many Classroom results to load at once. Please narrow your selection.',400);
}

export function responseError(err) {
  const status=err.status>=400&&err.status<600?err.status:500;
  return Response.json({error:status===500?'Unexpected server error. Check deployment logs.':err.message},{status,headers:{'Cache-Control':'no-store'}});
}

export function safeId(id) {
  if(typeof id!=='string'|| !/^[A-Za-z0-9_-]{1,180}$/.test(id)) throw new ApiError('Invalid Classroom identifier.');
  return encodeURIComponent(id);
}

export function rejectCrossOrigin(req) {
  const origin=req.headers.get('origin');
  if(origin && new URL(origin).host!==new URL(req.url).host) throw new ApiError('Request origin not allowed.',403);
}
