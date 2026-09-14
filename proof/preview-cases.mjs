import {createProofServer} from './server.mjs';
createProofServer().listen(4176,'127.0.0.1',()=>console.log('Case refinement: http://127.0.0.1:4176/review.html'));

