import {accessToken,ApiError,googleJson,rejectCrossOrigin,responseError,safeId} from '../../../lib/google';
export const runtime='nodejs';
export async function POST(req){
 try{
  rejectCrossOrigin(req);
  const token=await accessToken(req);const body=await req.json();
  if(body.approved!==true)throw new ApiError('Teacher approval is required before saving any grade.',400);
  const c=safeId(body.courseId),w=safeId(body.workId),s=safeId(body.submissionId);
  const percentage=Number(body.percentage);
  if(!Number.isFinite(percentage)||percentage<0||percentage>100)throw new ApiError('Invalid grade (0–100%).');
  const [work,sub]=await Promise.all([
    googleJson(token,`courses/${c}/courseWork/${w}`),
    googleJson(token,`courses/${c}/courseWork/${w}/studentSubmissions/${s}`)
  ]);
  if(!['TURNED_IN','RETURNED'].includes(sub.state))throw new ApiError('Only turned-in or returned work can be graded.');
  const maxPoints=Number(work.maxPoints||0);
  if(!Number.isFinite(maxPoints)||maxPoints<=0)throw new ApiError('Assignment must have a positive maximum point value.');
  const grade=Math.round(percentage/100*maxPoints*100)/100;
  try{
   const patched=await googleJson(token,`courses/${c}/courseWork/${w}/studentSubmissions/${s}?updateMask=draftGrade`,{
    method:'PATCH',body:JSON.stringify({draftGrade:grade})
   });
   return Response.json({success:true,grade:patched.draftGrade??grade,maxPoints,message:'Draft grade saved in Classroom. Students cannot see draft grades. Feedback comments were NOT posted.'});
  }catch(e){
   if(e.status===403){
    return Response.json({success:false,manualRequired:true,grade,maxPoints,message:'Google Classroom denied grade sync. Common cause: assignment was created in the Classroom interface or by a different Google developer project. Enter this score manually in Classroom. Feedback comments must also be posted manually.'});
   }
   throw e;
  }
 }catch(e){return responseError(e);}
}
