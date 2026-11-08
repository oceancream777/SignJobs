import type {RoleExplanation} from './role-reasoning';
export type LinkCandidate={href:string;text:string;context:string;source:'body'|'anchor'|'comment';evidence:string;afterCutoff:boolean};
export type Taxon={name:string;terms:string[]};
export type Settings={enabled:boolean;collapsed:boolean;mode:'rules'|'auto';modelReady:boolean;modelRevision?:string;taxonomy:Taxon[];commentCues:string[];dmCues:string[]};
export type Link={url:string;display:string;kind:string;source:'body'|'anchor'|'comment';afterCutoff:boolean;priority:number;isApplication?:boolean;evidence?:string};
export type Input={postId:string;author:string;postUrl:string|null;text:string;previewLength:number|null;textTruncated:boolean;inspectionText?:string;linkCandidates?:LinkCandidate[];linkInspection?:{examined:number;limited:boolean};anchors:{href:string;text:string;afterCutoff:boolean}[];comments:{text:string;anchors:{href:string;text:string;afterCutoff:boolean}[]}[]};
export type Marker='visible'|'after-cutoff'|'in-comments'|'dm'|'continues'|'none';
export type Summary={postId:string;postUrl:string|null;author:string;category:string;badges:string[];roleTitle:string;company:string|null;location:string|null;employmentType:string|null;experience:string|null;links:Link[];applicationStatus?:'closed'|'unknown';emails?:{address:string;source:'body'|'anchor'|'comment'}[];linkInComments:boolean;needsDM:boolean;baitMarker:Marker;linkState?:'found'|'not-loaded'|'not-found'|'incomplete';summary:string;summaryBase:string;roleExplanation?:RoleExplanation;textTruncated:boolean;confidence:number;source:'rules'|'on-device';modelRevision:string|null};
export type Saved={postId:string;postUrl:string|null;roleTitle:string;company:string|null;applyUrl:string|null;status:'saved'|'applied';timestamp:string};
