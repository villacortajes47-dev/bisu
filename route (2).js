import {accessToken,googleList,responseError} from '../../../../lib/google';
export const runtime='nodejs';
export async function GET(req){
 try{const token=await accessToken(req);const courses=await googleList(token,'courses?pageSize=100&courseStates=ACTIVE','courses');
 return Response.json({courses:courses.filter(c=>c.courseState==='ACTIVE').map(c=>({id:c.id,name:c.name,section:c.section||'',alternateLink:c.alternateLink||''}))});
 }catch(e){return responseError(e);}
}
