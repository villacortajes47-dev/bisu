import {ApiError,googleJson,safeId} from './google';

async function driveGet(token,url) {
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
 if(!r.ok) {
  let reason='';try{reason=(await r.json()).error?.message||'';}catch{}
  throw new ApiError(`Unable to access a Drive attachment (${r.status}). ${reason}`,r.status);
 }
 return r;
}

export async function getSubmissionContent(token,courseId,workId,submissionId) {
 const course=safeId(courseId),work=safeId(workId),submission=safeId(submissionId);
 const s=await googleJson(token,`courses/${course}/courseWork/${work}/studentSubmissions/${submission}`);
 if(!['TURNED_IN','RETURNED'].includes(s.state)) throw new ApiError('Student has not turned in this assignment.',400);
 const all=(s.assignmentSubmission?.attachments||[]);
 const driveFiles=all.filter(a=>a.driveFile?.id).slice(0,3);
 if(driveFiles.length===0) throw new ApiError('No readable Drive files attached. Use Manual Upload for a picture/PDF instead.',400);
 const files=[]; const warnings=[];
 let total=0;
 for(const a of driveFiles) {
  const id=safeId(a.driveFile.id);
  try {
   const md=await (await driveGet(token,`https://www.googleapis.com/drive/v3/files/${id}?fields=id%2Cname%2CmimeType%2Csize%2Ccapabilities(canDownload)`)).json();
   const mimetype=md.mimeType||'';
   if(md.capabilities?.canDownload===false){warnings.push(`${md.name||'File'}: not downloadable`);continue;}
   let url='';let type=mimetype;let name=md.name||'submission';
   if(mimetype==='application/vnd.google-apps.document') {
      url=`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text%2Fplain`;
      type='text/plain';name+='.txt';
   }else if(mimetype==='application/vnd.google-apps.presentation' || mimetype==='application/vnd.google-apps.spreadsheet'){
      url=`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application%2Fpdf`;
      type='application/pdf';name+='.pdf';
   }else if(/^(application\/pdf|image\/(jpeg|png|webp)|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(mimetype)){
      url=`https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
   }else{warnings.push(`${name}: unsupported file type ${mimetype}`);continue;}
   if(Number(md.size||0)>8*1024*1024) {warnings.push(`${name}: exceeds 8 MB per-file limit`);continue;}
   const file=await driveGet(token,url);
   const b=Buffer.from(await file.arrayBuffer());
   if(b.length>8*1024*1024||total+b.length>15*1024*1024){warnings.push(`${name}: file exceeds size limit`);continue;}
   total+=b.length;files.push({buffer:b,name,type});
  } catch(err) { warnings.push(`${a.driveFile.title||'Attachment'}: ${err.message}`); }
 }
 if(!files.length) throw new ApiError('No supported readable attachments. '+warnings.join(' | ').slice(0,500),400);
 return {files,warnings};
}
