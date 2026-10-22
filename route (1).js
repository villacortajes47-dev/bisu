import {accessToken,googleList,responseError,safeId} from '../../../../lib/google';
export const runtime='nodejs';
export async function GET(req){
 try{const t=await accessToken(req);const id=safeId(new URL(req.url).searchParams.get('courseId'));
 const data=await googleList(t,`courses/${id}/courseWork?pageSize=100`,'courseWork');
 return Response.json({assignments:data.filter(w=>w.workType==='ASSIGNMENT').map(w=>({id:w.id,title:w.title,description:w.description||'',maxPoints:w.maxPoints||100,alternateLink:w.alternateLink||'',state:w.state}))});
 }catch(e){return responseError(e);}
}
