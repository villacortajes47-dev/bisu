import OpenAI from 'openai';
import {accessToken,ApiError,rejectCrossOrigin,responseError} from '../../../lib/google';
import {getSubmissionContent} from '../../../lib/attachments';

export const runtime='nodejs';
export const maxDuration=60;

const schema={type:'object',additionalProperties:false,properties:{
 readable:{type:'boolean'},confidence:{type:'string',enum:['high','medium','low']},
 scores:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},score:{type:'number'},reason:{type:'string'}},required:['name','score','reason']}},
 comment:{type:'string'},strengths:{type:'string'},improvements:{type:'string'},warnings:{type:'array',items:{type:'string'}},
 transcriptionSummary:{type:'string'}
},required:['readable','confidence','scores','comment','strengths','improvements','warnings','transcriptionSummary']};

function validateRubric(raw) {
 if(!Array.isArray(raw)||raw.length<1||raw.length>8) throw new ApiError('Rubric must contain 1–8 criteria.');
 const list=raw.map(x=>({name:String(x.name||'').trim().slice(0,80),points:Number(x.points)}));
 if(list.some(x=>!x.name||!Number.isInteger(x.points)||x.points<1||x.points>100)||list.reduce((n,x)=>n+x.points,0)!==100)
   throw new ApiError('Rubric criteria must have valid names and add up to exactly 100 points.');
 return list;
}

function validMime(mime,name){
 return /^(application\/pdf|image\/(jpeg|png|webp)|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(mime);
}

export async function POST(req) {
 try {
  rejectCrossOrigin(req);
  await accessToken(req); // Teacher authorization required for both Classroom and manual uploads.
  if(!process.env.OPENAI_API_KEY) throw new ApiError('OPENAI_API_KEY is not configured on the server.',500);
  const form=await req.formData();
  const source=String(form.get('source')||'');
  const rubric=validateRubric(JSON.parse(String(form.get('rubric')||'[]')));
  const topic=String(form.get('topic')||'Automotive reporting reflection').slice(0,700);
  const instructions=String(form.get('instructions')||'').slice(0,2400);
  let files=[],warnings=[];
  if(source==='classroom') {
    const t=await accessToken(req);
    const contents=await getSubmissionContent(t,String(form.get('courseId')||''),String(form.get('workId')||''),String(form.get('submissionId')||''));
    files=contents.files;warnings=contents.warnings;
  } else if(source==='manual') {
    const uploads=form.getAll('files');
    if(uploads.length<1||uploads.length>3) throw new ApiError('Upload 1–3 images, PDF, DOCX, or text files.');
    let bytes=0;
    for(const f of uploads){
      if(!f || typeof f.arrayBuffer!=='function'||!validMime(f.type,f.name)) throw new ApiError('Unsupported file type. Use JPG, PNG, WEBP, PDF, DOCX, or TXT.');
      if(f.size>3*1024*1024) throw new ApiError('Manual files must be 3 MB or smaller each. Compress large pictures first.');
      bytes+=f.size;
      if(bytes>4*1024*1024) throw new ApiError('Combined upload must be 4 MB or smaller (Vercel request limit).');
      files.push({buffer:Buffer.from(await f.arrayBuffer()),type:f.type,name:f.name||'upload'});
    }
  } else throw new ApiError('Select a valid submission source.');
  const parts=[{type:'input_text',text:[
   'Evaluate this one individual student reflection using the instructor rubric below.',
   'This is an educational assessment draft, not a final grade. Never invent the content of illegible portions.',
   'Do not infer student identity or include personal data. Only grade visible and readable student work.',
   'For missing/unclear work, set readable=false and confidence=low, all scores to zero and warn teacher to review; do not assume answers.',
   'When partially readable, use a cautious score and explicit warnings. Give constructive respectful feedback.',
   'Return one score object for EACH rubric item, in EXACT rubric order with identical names and a concise evidence-based reason.',
   'Scores must be between 0 and criterion maximum. Use points, not percentages.',
   'Feedback should be supportive, specific to the actual submission, 2-4 sentences in English.',
   'Rubric: '+JSON.stringify(rubric),
   'Reporting topic: '+topic,
   'Instructor instructions: '+instructions
  ].join('\n')}];
  for(const f of files){
    const base64=f.buffer.toString('base64');
    if(f.type.startsWith('image/'))parts.push({type:'input_image',image_url:`data:${f.type};base64,${base64}`,detail:'high'});
    else if(f.type==='text/plain')parts.push({type:'input_text',text:`FILE ${f.name}:\n${f.buffer.toString('utf8').slice(0,120000)}`});
    else parts.push({type:'input_file',filename:f.name,file_data:`data:${f.type};base64,${base64}`});
  }
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY, timeout:55000});
  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||'gpt-4.1-mini',
   instructions:'You are a careful, unbiased college Automotive Technology instructor grading reflective writing. Return strictly structured JSON.',
   input:[{role:'user',content:parts}],
   text:{format:{type:'json_schema',name:'reflection_grade',strict:true,schema}},
   max_output_tokens:1800
  });
  if(!response.output_text) throw new ApiError('AI did not return an evaluation. Please retry.',502);
  let result;
  try{result=JSON.parse(response.output_text);}catch{throw new ApiError('Invalid AI response; please retry.',502);}
  if(result.scores.length!==rubric.length||result.scores.some((c,i)=>c.name!==rubric[i].name))throw new ApiError('Rubric mismatch in AI result; please retry.',502);
  const scores=result.scores.map((c,i)=>({...c,score:Math.min(rubric[i].points,Math.max(0,Math.round(Number(c.score)||0)))}));
  return Response.json({
   ...result,scores,total:scores.reduce((s,c)=>s+c.score,0),
   warnings:[...warnings,...result.warnings],
   reviewRequired:!result.readable||result.confidence==='low'||warnings.length>0,
   model:process.env.OPENAI_MODEL||'gpt-4.1-mini'
  },{headers:{'Cache-Control':'no-store'}});
 }catch(e){return responseError(e);}
}
