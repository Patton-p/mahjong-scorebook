const cloud=require('wx-server-sdk');
const tencentcloud=require('tencentcloud-sdk-nodejs-ocr');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async event=>{
 const {OPENID}=cloud.getWXContext();
 if(!OPENID)return {ok:false,message:'请通过微信小程序调用'};
 const allowed=(process.env.OCR_ALLOWED_OPENIDS||'').split(',').map(v=>v.trim()).filter(Boolean);
 if(!allowed.includes(OPENID))return {ok:false,code:'NOT_ALLOWED',openid:OPENID,message:'当前用户未开通OCR'};
 const image=event&&event.imageBase64;
 if(typeof image!=='string'||image.length<16||image.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(image))return {ok:false,message:'图片格式无效或超过2MB'};
 if(!process.env.OCR_SECRET_ID||!process.env.OCR_SECRET_KEY)return {ok:false,message:'请配置云函数OCR_SECRET_ID和OCR_SECRET_KEY'};
 try{
 const Client=tencentcloud.ocr.v20181119.Client;
 const client=new Client({credential:{secretId:process.env.OCR_SECRET_ID,secretKey:process.env.OCR_SECRET_KEY},region:process.env.OCR_REGION||'ap-guangzhou',profile:{httpProfile:{endpoint:'ocr.tencentcloudapi.com',reqTimeout:35}}});
 const response=await client.GeneralAccurateOCR({ImageBase64:image});
 return {ok:true,detections:(response.TextDetections||[]).map(d=>({DetectedText:d.DetectedText,ItemPolygon:d.ItemPolygon,Confidence:d.Confidence}))};
 }catch(e){console.error('OCR request failed',e.code||'unknown');return {ok:false,message:'OCR服务调用失败，请检查额度、密钥权限和服务开通状态'};}
};
