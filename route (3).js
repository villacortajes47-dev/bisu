import {accessToken,googleList,responseError,safeId} from '../../../../lib/google';
export const runtime='nodejs';
export async function GET(req){
 try{const t=await accessToken(req);const u=new URL(req.url).searchParams;
 const course=safeId(u.get('courseId')),work=safeId(u.get('workId'));
 const [submissions,roster]=await Promise.all([
 googleList(t,`courses/${course}/courseWork/${work}/studentSubmissions?pageSize=100`,'studentSubmissions'),
 googleList(t,`courses/${course}/students?pageSize=100`,'students')
 ]);
 const users=Object.fromEntries(roster.map(s=>[s.userId,[s.profile?.name?.fullName||'Student',s.profile?.emailAddress||'']]));
 return Response.json({submissions:submissions.map(s=>({
  id:s.id,userId:s.userId,name:users[s.userId]?.[0]||`Student ${s.userId}`,
  state:s.state,assignedGrade:s.assignedGrade??null,draftGrade:s.draftGrade??null,
  attachments:(s.assignmentSubmission?.attachments||[]).map(a=>({
   type:a.driveFile?'driveFile':a.link?'link':a.youTubeVideo?'video':'other',
   title:a.driveFile?.title||'',url:a.driveFile?.alternateLink||a.link?.url||'',
  }))
 }))});
 }catch(e){return responseError(e);}
}
