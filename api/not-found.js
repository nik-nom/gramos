export default function handler(req,res){
 res.statusCode=404;res.setHeader('X-Robots-Tag','noindex,nofollow');res.setHeader('Cache-Control','no-store');res.end('Not found');
}
