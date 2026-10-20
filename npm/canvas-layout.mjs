import { fail } from './runtime.mjs';

// Application layout only: service calls, uploads and verified writes belong
// to sealseek-media-cli. The original fits the result's row without cropping.
export function comparisonRow(input) {
 if(!input || typeof input!=='object' || Array.isArray(input)) throw fail('INVALID_INPUT','Expected a comparison row object.');
 const {run_id,row_index,top=0,source,result}=input;
 if(typeof run_id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(run_id)) throw fail('INVALID_INPUT','run_id must be a stable 1-80 character ASCII operation key.');
 if(!Number.isSafeInteger(row_index)||row_index<1||row_index>10000||!Number.isFinite(top)||top<0||top>1e9) throw fail('INVALID_INPUT','Invalid row index or top coordinate.');
 for(const asset of [source,result]) {
  if(!asset||![asset.width,asset.height].every(v=>Number.isSafeInteger(v)&&v>0)) throw fail('INVALID_INPUT','Both assets need measured positive integer dimensions.');
  let url;try{url=new URL(asset.url);}catch{throw fail('INVALID_INPUT','Both assets need uploaded HTTP(S) URLs.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password) throw fail('INVALID_INPUT','Asset URLs must use HTTP(S) without embedded credentials.');
 }
 const width=480,horizontalGap=24,verticalGap=32;
 const height=width*result.height/result.width;
 const scale=Math.min(width/source.width,height/source.height);
 const sourceWidth=source.width*scale,sourceHeight=source.height*scale;
 if(![height,sourceWidth,sourceHeight].every(n=>Number.isFinite(n)&&n>0&&n<=100000)||top+height+verticalGap>1e9) throw fail('LAYOUT_UNSUPPORTED','Image geometry exceeds the canvas contract.');
 const rects=[{x:(width-sourceWidth)/2,y:top,width:sourceWidth,height:sourceHeight},{x:width+horizontalGap,y:top,width,height}];
 const media=[source,result].map((asset,index)=>({
  id:`${run_id}-row-${row_index}-${index===0?'source':'result'}`,kind:'image',urls:[asset.url],
  placement:{mode:'explicit',positions:[rects[index]]}
 }));
 if(result.generationParams!==undefined) {
  if(!result.generationParams||typeof result.generationParams!=='object'||Array.isArray(result.generationParams)) throw fail('INVALID_INPUT','generationParams must be an object accepted by the media CLI.');
  media[1].generationParams=result.generationParams;
 }
 return {ok:true,row_index,top,next_top:top+height+verticalGap,layout:{column_width:width,horizontal_gap:horizontalGap,vertical_gap:verticalGap},batch:{frames:[],media}};
}
