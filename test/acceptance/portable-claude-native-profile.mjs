// Test-only pinned native187 metadata. No filesystem, credentials, process or
// model activity at import. Deny families close the reviewed read-only fallback;
// they are not allowed commands or proof of effective sandbox enforcement.
export const REVIEWED_CLAUDE_NATIVE=Object.freeze({
 version:'2.1.187',
 sha256:'a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3',
});
export const PINNED_READONLY_BASH_HEADS=Object.freeze(["[[","alias","arch","base64","basename","cal","cat","cd","claude","cmp","column","comm","cut","date","df","diff","dirname","docker","du","echo","egrep","expand","expr","false","fd","fdfind","fgrep","file","find","fmt","fold","free","git","grep","groups","head","help","hexdump","history","hostname","id","ifconfig","ip","jq","locale","ls","lsof","man","md5sum","netstat","nl","node","nproc","numfmt","od","paste","pgrep","pr","printf","ps","pwd","pyright","python","python3","readlink","realpath","rev","rg","sed","seq","sha1sum","sha256sum","sleep","sort","ss","stat","strings","tac","tail","test","tput","tr","tree","true","tsort","type","uname","unexpand","uniq","uptime","wc","which","whoami","xargs"]);
