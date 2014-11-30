(function(){function n(r,t,o){var e,a,i=t.edges,c=i.length,u={type:"MultiPoint",coordinates:t.face},f=t.face.filter(function(n){return 90!==Math.abs(n[1])}),h=d3.geo.bounds({type:"MultiPoint",coordinates:f}),d=!1,s=-1,l=h[1][0]-h[0][0],p=180===l||360===l?[(h[0][0]+h[1][0])/2,(h[0][1]+h[1][1])/2]:d3.geo.centroid(u);if(o)for(;c>++s&&i[s]!==o;);++s;for(var v=0;c>v;++v)a=i[(v+s)%c],Array.isArray(a)?(d||(r.point((e=d3.geo.interpolate(a[0],p)(g))[0],e[1]),d=!0),r.point((e=d3.geo.interpolate(a[1],p)(g))[0],e[1])):(d=!1,a!==o&&n(r,a,t))}function r(n,r){for(var t,o,e=n.length,a=null,i=0;e>i;++i){t=n[i];for(var c=r.length;--c>=0;)if(o=r[c],t[0]===o[0]&&t[1]===o[1]){if(a)return[a,t];a=t}}}function t(n,r){var t=a(n[1],n[0]),o=a(r[1],r[0]),u=c(t,o),f=i(t)/i(o);return e([1,0,n[0][0],0,1,n[0][1]],e([f,0,0,0,f,0],e([Math.cos(u),Math.sin(u),0,-Math.sin(u),Math.cos(u),0],[1,0,-r[0][0],0,1,-r[0][1]])))}function o(n){var r=1/(n[0]*n[4]-n[1]*n[3]);return[r*n[4],-r*n[1],r*(n[1]*n[5]-n[2]*n[4]),-r*n[3],r*n[0],r*(n[2]*n[3]-n[0]*n[5])]}function e(n,r){return[n[0]*r[0]+n[1]*r[3],n[0]*r[1]+n[1]*r[4],n[0]*r[2]+n[1]*r[5]+n[2],n[3]*r[0]+n[4]*r[3],n[3]*r[1]+n[4]*r[4],n[3]*r[2]+n[4]*r[5]+n[5]]}function a(n,r){return[n[0]-r[0],n[1]-r[1]]}function i(n){return Math.sqrt(n[0]*n[0]+n[1]*n[1])}function c(n,r){return Math.atan2(n[0]*r[1]-n[1]*r[0],n[0]*r[0]+n[1]*r[1])}function u(n,r){for(var t=0,o=n.length,e=0;o>t;++t)e+=n[t]*r[t];return e}function f(n,r){return[n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]]}function h(n){return[Math.atan2(n[1],n[0])*m,Math.asin(Math.max(-1,Math.min(1,n[2])))*m]}function d(n){var r=n[0]*M,t=n[1]*M,o=Math.cos(t);return[o*Math.cos(r),o*Math.sin(r),Math.sin(t)]}function s(n,r){return n&&r&&n[0]===r[0]&&n[1]===r[1]}function l(n){for(var r=n.length,t=[],o=n[r-1],e=0;r>e;++e)t.push([o,o=n[e]]);return t}function p(n){return n.project.invert||n.children&&n.children.some(p)}var g=1e-6,v=Math.PI,M=v/180,m=180/v;d3.geo.polyhedron=function(a,i,c){function u(n,o){if(n.edges=l(n.face),o)if(o.face){var a=n.shared=r(n.face,o.face),i=t(a.map(o.project),a.map(n.project));n.transform=o.transform?e(o.transform,i):i;for(var c=o.edges,f=0,h=c.length;h>f;++f)s(a[0],c[f][1])&&s(a[1],c[f][0])&&(c[f]=n),s(a[0],c[f][0])&&s(a[1],c[f][1])&&(c[f]=n);for(var c=n.edges,f=0,h=c.length;h>f;++f)s(a[0],c[f][0])&&s(a[1],c[f][1])&&(c[f]=o),s(a[0],c[f][1])&&s(a[1],c[f][0])&&(c[f]=o)}else n.transform=o.transform;return n.children&&n.children.forEach(function(r){u(r,n)}),n}function f(n,r){var t,o=i(n,r),e=o.project([n*m,r*m]);return(t=o.transform)?[t[0]*e[0]+t[1]*e[1]+t[2],-(t[3]*e[0]+t[4]*e[1]+t[5])]:(e[1]=-e[1],e)}function h(n,r){var t=n.project.invert,e=n.transform,a=r;if(e&&(e=o(e),a=[e[0]*a[0]+e[1]*a[1]+e[2],e[3]*a[0]+e[4]*a[1]+e[5]]),t&&n===d(i=t(a)))return i;for(var i,c=n.children,u=0,f=c&&c.length;f>u;++u)if(i=h(c[u],r))return i}function d(n){return i(n[0]*M,n[1]*M)}c=null==c?-v/6:c,u(a,{transform:[Math.cos(c),Math.sin(c),0,-Math.sin(c),Math.cos(c),0]}),p(a)&&(f.invert=function(n,r){var t=h(a,[n,-r]);return t&&(t[0]*=M,t[1]*=M,t)});var g=d3.geo.projection(f),y=g.stream;return g.stream=function(r){var t=g.rotate(),o=y(r),e=(g.rotate([0,0]),y(r));return g.rotate(t),o.sphere=function(){e.polygonStart(),e.lineStart(),n(e,a),e.lineEnd(),e.polygonEnd()},o},g},d3.geo.polyhedron.butterfly=function(n){n=n||function(n){var r=d3.geo.centroid({type:"MultiPoint",coordinates:n});return d3.geo.gnomonic().scale(1).translate([0,0]).rotate([-r[0],-r[1]])};var r=d3.geo.polyhedron.octahedron.map(function(r){return{face:r,project:n(r)}});return[-1,0,0,1,0,1,4,5].forEach(function(n,t){var o=r[n];o&&(o.children||(o.children=[])).push(r[t])}),d3.geo.polyhedron(r[0],function(n,t){return r[-v/2>n?0>t?6:4:0>n?0>t?2:0:v/2>n?0>t?3:1:0>t?7:5]})},d3.geo.polyhedron.waterman=function(n){function r(n,r){var t=Math.cos(r),o=[t*Math.cos(n),t*Math.sin(n),Math.sin(r)],a=-v/2>n?0>r?6:4:0>n?0>r?2:0:v/2>n?0>r?3:1:0>r?7:5,c=e[a];return i[0>u(c[0],o)?8+3*a:0>u(c[1],o)?8+3*a+1:0>u(c[2],o)?8+3*a+2:a]}n=n||function(n){var r=6===n.length?d3.geo.centroid({type:"MultiPoint",coordinates:n}):n[0];return d3.geo.gnomonic().scale(1).translate([0,0]).rotate([-r[0],-r[1]])};var t=d3.geo.polyhedron.octahedron,o=t.map(function(n){for(var r,t=n.map(d),o=t.length,e=t[o-1],a=[],i=0;o>i;++i)r=t[i],a.push(h([.9486832980505138*e[0]+.31622776601683794*r[0],.9486832980505138*e[1]+.31622776601683794*r[1],.9486832980505138*e[2]+.31622776601683794*r[2]]),h([.9486832980505138*r[0]+.31622776601683794*e[0],.9486832980505138*r[1]+.31622776601683794*e[1],.9486832980505138*r[2]+.31622776601683794*e[2]])),e=r;return a}),e=[],a=[-1,0,0,1,0,1,4,5];o.forEach(function(n,r){for(var i=t[r],c=i.length,u=e[r]=[],h=0;c>h;++h)o.push([i[h],n[(2*h+2)%(2*c)],n[(2*h+1)%(2*c)]]),a.push(r),u.push(f(d(n[(2*h+2)%(2*c)]),d(n[(2*h+1)%(2*c)])))});var i=o.map(function(r){return{project:n(r),face:r}});return a.forEach(function(n,r){var t=i[n];t&&(t.children||(t.children=[])).push(i[r])}),d3.geo.polyhedron(i[0],r).center([0,45])};var y=[[0,90],[-90,0],[0,0],[90,0],[180,0],[0,-90]];d3.geo.polyhedron.octahedron=[[0,2,1],[0,3,2],[5,1,2],[5,2,3],[0,1,4],[0,4,3],[5,4,1],[5,3,4]].map(function(n){return n.map(function(n){return y[n]})});var j=Math.atan(Math.SQRT1_2)*m,E=[[0,j],[90,j],[180,j],[-90,j],[0,-j],[90,-j],[180,-j],[-90,-j]];d3.geo.polyhedron.cube=[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].map(function(n){return n.map(function(n){return E[n]})})})();