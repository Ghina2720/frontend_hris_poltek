import{p as V,h as D,j as e,R as q,r as _}from"./index-OD76-hEY.js";import{u as Q,C as F}from"./index.esm-lnbXZfoB.js";import{c as $,a as T,o as U}from"./yup-DLAn8Y5X.js";import{P as Y}from"./PageTitle-DpGkklOU.js";import{R as f}from"./Row-n1-U6AUE.js";import{C as d}from"./Col-P2C8LHCc.js";import{C as P}from"./Card-qYBOXQE2.js";import{F as t}from"./Form-0zI6dkW5.js";import{B as b}from"./Button-Btj8yR6k.js";import{P as H}from"./ProgressBar-IsJIZGX1.js";import"./Anchor-UrwP9XvS.js";import"./Button-D77Y5dqZ.js";import"./CardHeaderContext-DlhUP7se.js";import"./index-B1O4rx35.js";import"./index-Chjiymov.js";import"./FormGroup-BY0x1Dr8.js";import"./warning-BfQGvuZr.js";import"./FormLabel-BlIUPKeq.js";import"./ElementChildren-B7bolkkb.js";import"./FormText-Bu577jQ_.js";var E={exports:{}},J=E.exports,G;function X(){return G||(G=1,function(v,x){(function(j,m){m(x,V())})(J,function(j,m){var h="default"in m?m.default:m;function o(c){return(o=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(a){return typeof a}:function(a){return a&&typeof Symbol=="function"&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a})(c)}function R(c,a){for(var i=0;i<a.length;i++){var l=a[i];l.enumerable=l.enumerable||!1,l.configurable=!0,"value"in l&&(l.writable=!0),Object.defineProperty(c,l.key,l)}}function u(c,a,i){return a in c?Object.defineProperty(c,a,{value:i,enumerable:!0,configurable:!0,writable:!0}):c[a]=i,c}function z(c){return(z=Object.setPrototypeOf?Object.getPrototypeOf:function(a){return a.__proto__||Object.getPrototypeOf(a)})(c)}function p(c,a){return(p=Object.setPrototypeOf||function(i,l){return i.__proto__=l,i})(c,a)}function r(c){if(c===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return c}function y(c){var a=function(){if(typeof Reflect>"u"||!Reflect.construct||Reflect.construct.sham)return!1;if(typeof Proxy=="function")return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch{return!1}}();return function(){var i,l=z(c);return i=a?(i=z(this).constructor,Reflect.construct(l,arguments,i)):l.apply(this,arguments),l=this,!(i=i)||typeof i!="object"&&typeof i!="function"?r(l):i}}function W(c,a){var i,l=(a=a===void 0?{}:a).insertAt;c&&typeof document<"u"&&(i=document.head||document.getElementsByTagName("head")[0],(a=document.createElement("style")).type="text/css",l==="top"&&i.firstChild?i.insertBefore(a,i.firstChild):i.appendChild(a),a.styleSheet?a.styleSheet.cssText=c:a.appendChild(document.createTextNode(c)))}var C={animated:"rsw_1z",fadeInRight:"rsw_1M",fadeInLeft:"rsw_19",fadeOutRight:"rsw_3C",fadeOutLeft:"rsw_1u"};W(`/**
 * Snippets from animate.css
 * Credit goes to https://github.com/daneden
 * github.com/daneden/animate.css
*/
.rsw_1z {
  -webkit-animation-duration: .8192s;
  animation-duration: .8192s;
  -webkit-animation-fill-mode: backwards;
  animation-fill-mode: backwards;
}

/** fadeInRight */
@-webkit-keyframes rsw_1M {
  from {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}

@keyframes rsw_1M {
  from {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}

.rsw_1M {
  -webkit-animation-name: rsw_1M;
  animation-name: rsw_1M;
}

/** fadeInLeft */
@-webkit-keyframes rsw_19 {
  from {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}

@keyframes rsw_19 {
  from {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}

.rsw_19 {
  -webkit-animation-name: rsw_19;
  animation-name: rsw_19;
}

/** fadeOutRight */
@-webkit-keyframes rsw_3C {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0);
  }
}

@keyframes rsw_3C {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0);
  }
}

.rsw_3C {
  -webkit-animation-name: rsw_3C;
  animation-name: rsw_3C;
}

/** fadeOutLeft */
@-webkit-keyframes rsw_1u {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0);
  }
}

@keyframes rsw_1u {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0);
  }
}

.rsw_1u {
  -webkit-animation-name: rsw_1u;
  animation-name: rsw_1u;
}
`);var B="rsw_2Y",K="rsw_2f",M="rsw_3G";W(`/** Step Wizard */
.rsw_2Y {
    position: relative;
}

.rsw_2f {
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 0;
}

.rsw_3G {
    opacity: 1;
    pointer-events: inherit;
    position: relative;
    z-index: 1;
}
`);var A=function(){(function(g,n){if(typeof n!="function"&&n!==null)throw new TypeError("Super expression must either be null or a function");g.prototype=Object.create(n&&n.prototype,{constructor:{value:g,writable:!0,configurable:!0}}),n&&p(g,n)})(l,m.PureComponent);var c,a,i=y(l);function l(g){var n;return function(s,w){if(!(s instanceof w))throw new TypeError("Cannot call a class as a function")}(this,l),u(r(n=i.call(this,g)),"initialState",function(){var s={activeStep:0,classes:{},hashKeys:{},namedSteps:{}},w=(typeof window>"u"?"undefined":o(window))==="object"?n.getHash():"",S=n.getSteps();S.forEach(function(L,k){s.hashKeys[k]=L.props&&L.props.hashKey||"step".concat(k+1),s.hashKeys[s.hashKeys[k]]=k,s.namedSteps[k]=L.props&&L.props.stepName||"step".concat(k+1),s.namedSteps[s.namedSteps[k]]=k});var N=n.props.initialStep-1;return N&&S[N]&&(s.activeStep=N),n.props.isHashEnabled&&w&&s.hashKeys[w]!==void 0&&(s.activeStep=s.hashKeys[w]),n.props.transitions&&(s.classes[s.activeStep]=n.props.transitions.intro||""),s}),u(r(n),"getHash",function(){return decodeURI(window.location.hash).replace(/^#/,"")}),u(r(n),"getTransitions",function(){return n.props.transitions||{enterRight:"".concat(C.animated," ").concat(C.fadeInRight),enterLeft:"".concat(C.animated," ").concat(C.fadeInLeft),exitRight:"".concat(C.animated," ").concat(C.fadeOutRight),exitLeft:"".concat(C.animated," ").concat(C.fadeOutLeft)}}),u(r(n),"onHashChange",function(){n.setActiveStep(n.state.hashKeys[n.getHash()]||0)}),u(r(n),"isInvalidStep",function(s){return s<0||s>=n.totalSteps}),u(r(n),"setActiveStep",function(s){var w,S,N=n.state.activeStep;N!==s&&(n.isInvalidStep(s)||(w=n.state.classes,S=n.getTransitions(),N<s?(w[N]=S.exitLeft,w[s]=S.enterRight):(w[N]=S.exitRight,w[s]=S.enterLeft),n.setState({activeStep:s,classes:w},function(){n.onStepChange({previousStep:N+1,activeStep:s+1})})))}),u(r(n),"onStepChange",function(s){n.props.onStepChange(s),n.props.isHashEnabled&&n.updateHash(n.state.activeStep)}),u(r(n),"getSteps",function(){return h.Children.toArray(n.props.children)}),u(r(n),"firstStep",function(){return n.goToStep(1)}),u(r(n),"lastStep",function(){return n.goToStep(n.totalSteps)}),u(r(n),"nextStep",function(){return n.setActiveStep(n.state.activeStep+1)}),u(r(n),"previousStep",function(){return n.setActiveStep(n.state.activeStep-1)}),u(r(n),"goToStep",function(s){n.props.isHashEnabled&&typeof s=="string"&&n.state.hashKeys[s]!==void 0?n.setActiveStep(n.state.hashKeys[s]):n.setActiveStep(s-1)}),u(r(n),"goToNamedStep",function(s){typeof s=="string"&&n.state.namedSteps[s]!==void 0?n.setActiveStep(n.state.namedSteps[s]):console.error('Cannot find step with name "'.concat(s,'"'))}),u(r(n),"updateHash",function(s){window.location.hash=n.state.hashKeys[s]}),u(r(n),"isReactComponent",function(s){return s=s.type,typeof s=="function"||o(s)==="object"}),n.state=n.initialState(),n}return c=l,(a=[{key:"componentDidMount",value:function(){this.props.isHashEnabled&&window.addEventListener("hashchange",this.onHashChange),this.props.instance(this)}},{key:"componentWillUnmount",value:function(){this.props.isHashEnabled&&window.removeEventListener("hashchange",this.onHashChange)}},{key:"currentStep",get:function(){return this.state.activeStep+1}},{key:"totalSteps",get:function(){return this.getSteps().length}},{key:"render",value:function(){var g=this,n={currentStep:this.currentStep,totalSteps:this.totalSteps,nextStep:this.nextStep,previousStep:this.previousStep,goToStep:this.goToStep,goToNamedStep:this.goToNamedStep,firstStep:this.firstStep,lastStep:this.lastStep},s=this.state.classes,w=h.Children.map(this.getSteps(),function(S,N){return S?(n.isActive=N===g.state.activeStep,n.transitions=s[N],!g.props.isLazyMount||g.props.isLazyMount&&n.isActive?h.createElement(I,n,g.isReactComponent(S)?h.cloneElement(S,n):S):null):null});return h.createElement("div",{className:this.props.className},this.props.nav&&h.cloneElement(this.props.nav,n),h.createElement("div",{className:B},w))}}])&&R(c.prototype,a),l}();A.defaultProps={children:[],className:null,initialStep:1,instance:function(){},isHashEnabled:!1,isLazyMount:!1,nav:null,onStepChange:function(){},transitions:void 0};var I=function(l){var a=l.children,i=l.isActive,l=l.transitions;return h.createElement("div",{className:"".concat(K," ").concat(l," ").concat(i?M:"").trim()},a)};I.defaultProps={children:[],isActive:!1,transitions:""},j.Step=I,j.default=A,Object.defineProperty(j,"__esModule",{value:!0})})}(E,E.exports)),E.exports}var Z=X();const O=D(Z),ee=()=>{const v=_.useRef(null),[x,j]=_.useState(1),m=()=>{v.current&&(v.current.nextStep(),j(o=>o+1))},h=()=>{v.current&&(v.current.previousStep(),j(o=>o-1))};return e.jsx(P,{children:e.jsxs(P.Body,{className:"overflow-hidden",children:[e.jsx("h4",{className:"header-title mb-3",children:" Basic Wizard"}),e.jsxs(O,{instance:o=>{v.current=o},onStepChange:o=>j(o.activeStep),children:[e.jsx("div",{children:e.jsxs(t,{children:[e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"exampleEmail",column:!0,md:3,children:"Email"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"email",name:"exampleEmail",id:"exampleEmail",placeholder:"Enter email"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"examplePassword",column:!0,md:3,children:"Password"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"password",name:"examplePassword",id:"examplePassword",placeholder:"password placeholder",defaultValue:"12345"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"examplerePassword",column:!0,md:3,children:"Re-Password"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"password",name:"exampleRepassword",id:"examplerePassword",placeholder:"password",defaultValue:"12345"})})]}),e.jsx("ul",{className:"list-inline wizard mb-0",children:e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:m,disabled:x===3,variant:"success",children:"Next"})})})]})}),e.jsx("div",{children:e.jsxs(t,{children:[e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"fname",column:!0,md:3,children:"First Name"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"fname",id:"fname",placeholder:"Enter first name"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"lname",column:!0,md:3,children:"Last Name"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"lname",id:"lname",placeholder:"enter last name"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"phone",column:!0,md:3,children:"Phone Number"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"phone",id:"phone",placeholder:"enter phone number"})})]}),e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:h,disabled:x===1,variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:m,disabled:x===3,variant:"success",children:"Next"})})]})]})}),e.jsx("div",{children:e.jsxs(f,{children:[e.jsx(d,{sm:12,children:e.jsxs("div",{className:"text-center",children:[e.jsx("h2",{className:"mt-0",children:e.jsx("i",{className:"mdi mdi-check-all"})}),e.jsx("h3",{className:"mt-0",children:"Thank you !"}),e.jsx("p",{className:"w-75 mb-2 mx-auto",children:"Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat. In egestas mattis dui. Aliquam mattis dictum aliquet."}),e.jsx("div",{className:"mb-3",children:e.jsxs(t.Check,{type:"checkbox",className:"d-inline-block",children:[e.jsx(t.Check.Input,{type:"checkbox"}),e.jsx(t.Check.Label,{children:"I agree with the Terms and Conditions"})]})})]})}),e.jsx(d,{sm:12,children:e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:h,disabled:x===1,variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{variant:"success",children:"Submit"})})]})})]})})]})]})})},ne=()=>{const v=_.useRef(null),[x,j]=_.useState(1),m=()=>{v.current&&(v.current.nextStep(),j(o=>o+1))},h=()=>{v.current&&(v.current.previousStep(),j(o=>o-1))};return e.jsx(P,{children:e.jsxs(P.Body,{className:"overflow-hidden",children:[e.jsx("h4",{className:"header-title mb-3",children:"Wizard with Progress bar"}),e.jsxs(q.Fragment,{children:[e.jsx(H,{animated:!0,striped:!0,variant:"success",now:x/3*100,className:"mb-3 progress-sm"}),e.jsxs(O,{instance:o=>{v.current=o},onStepChange:o=>j(o==null?void 0:o.activeStep),children:[e.jsx("div",{children:e.jsxs(t,{children:[e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"exampleEmail",column:!0,md:3,children:"Email"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"email",name:"exampleEmail",id:"exampleEmail2",placeholder:"Enter email"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"examplePassword",column:!0,md:3,children:"Password"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"password",name:"password",id:"examplePassword2",placeholder:"password placeholder",defaultValue:"12345"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"examplerePassword",column:!0,md:3,children:"Re-Password"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"password",name:"repassword",id:"examplerePassword2",placeholder:"password",defaultValue:"12345"})})]}),e.jsx("ul",{className:"list-inline wizard mb-0",children:e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:m,disabled:x===3,variant:"success",children:"Next"})})})]})}),e.jsx("div",{children:e.jsxs(t,{children:[e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"fname",column:!0,md:3,children:"First Name"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"fname",id:"fname",placeholder:"Enter first name"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"lname",column:!0,md:3,children:"Last Name"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"lname",id:"lname",placeholder:"enter last name"})})]}),e.jsxs(t.Group,{as:f,className:"mb-3",children:[e.jsx(t.Label,{htmlFor:"phone",column:!0,md:3,children:"Phone Number"}),e.jsx(d,{md:9,children:e.jsx(t.Control,{type:"text",name:"phone",id:"phone",placeholder:"enter phone number"})})]}),e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:h,disabled:x===1,variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:m,disabled:x===3,variant:"success",children:"Next"})})]})]})}),e.jsx("div",{children:e.jsxs(f,{children:[e.jsx(d,{sm:12,children:e.jsxs("div",{className:"text-center",children:[e.jsx("h2",{className:"mt-0",children:e.jsx("i",{className:"mdi mdi-check-all"})}),e.jsx("h3",{className:"mt-0",children:"Thank you !"}),e.jsx("p",{className:"w-75 mb-2 mx-auto",children:"Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat. In egestas mattis dui. Aliquam mattis dictum aliquet."}),e.jsx("div",{className:"mb-3",children:e.jsxs(t.Check,{type:"checkbox",className:"d-inline-block",children:[e.jsx(t.Check.Input,{type:"checkbox"})," ",e.jsx(t.Check.Label,{children:"I agree with the Terms and Conditions"})]})})]})}),e.jsx(d,{sm:12,children:e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:h,disabled:x===1,variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{variant:"success",children:"Submit"})})]})})]})})]})]})]})})},te=$({email:T().email("Please enter a valid email").required("Please enter email"),password:T().required("Please enter password"),fName:T().required("Please enter first name"),lName:T().required("Please enter last name")}),se=()=>{const{handleSubmit:v,control:x,trigger:j}=Q({resolver:U(te)}),m=_.useRef(null),[h,o]=_.useState(1),R=async()=>{h===1&&(await j(["email","password"])&&m.current?(m.current.nextStep(),o(r=>r+1)):console.log("Step 1 validation failed")),h===2&&(await j(["fName","lName"])&&m.current?(m.current.nextStep(),o(r=>r+1)):console.log("Step 2 validation failed"))},u=()=>{m.current&&(m.current.previousStep(),o(p=>p-1))},z=p=>{console.log("Form Data:",p)};return e.jsx(P,{children:e.jsxs(P.Body,{className:"overflow-hidden",children:[e.jsx("h4",{className:"header-title mb-3",children:"Wizard with Validation"}),e.jsxs(t,{onSubmit:v(z),children:[e.jsx(H,{animated:!0,striped:!0,variant:"success",now:h/3*100,className:"mb-3 progress-sm"}),e.jsxs(O,{instance:p=>{m.current=p},onStepChange:p=>o(p.activeStep),children:[e.jsxs("div",{children:[e.jsx(F,{control:x,name:"email",render:({field:p,fieldState:r})=>{var y;return e.jsxs(t.Group,{className:"mb-3",children:[e.jsx(t.Label,{children:"Email"}),e.jsx(t.Control,{...p,type:"email",isInvalid:!!r.error}),e.jsx(t.Control.Feedback,{type:"invalid",children:(y=r.error)==null?void 0:y.message})]})}}),e.jsx(F,{control:x,name:"password",render:({field:p,fieldState:r})=>{var y;return e.jsxs(t.Group,{className:"mb-3",children:[e.jsx(t.Label,{children:"Password"}),e.jsx(t.Control,{...p,type:"password",isInvalid:!!r.error}),e.jsx(t.Control.Feedback,{type:"invalid",children:(y=r.error)==null?void 0:y.message})]})}}),e.jsx("ul",{className:"list-inline wizard mb-0",children:e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:R,type:"button",variant:"success",children:"Next"})})})]}),e.jsxs("div",{children:[e.jsx(F,{control:x,name:"fName",render:({field:p,fieldState:r})=>{var y;return e.jsxs(t.Group,{className:"mb-3",children:[e.jsx(t.Label,{children:"First Name"}),e.jsx(t.Control,{...p,type:"text",isInvalid:!!r.error}),e.jsx(t.Control.Feedback,{type:"invalid",children:(y=r.error)==null?void 0:y.message})]})}}),e.jsx(F,{control:x,name:"lName",render:({field:p,fieldState:r})=>{var y;return e.jsxs(t.Group,{className:"mb-3",children:[e.jsx(t.Label,{children:"Last Name"}),e.jsx(t.Control,{...p,type:"text",isInvalid:!!r.error}),e.jsx(t.Control.Feedback,{type:"invalid",children:(y=r.error)==null?void 0:y.message})]})}}),e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:u,type:"button",variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{onClick:R,type:"button",variant:"success",children:"Next"})})]})]}),e.jsx("div",{children:e.jsxs(f,{children:[e.jsx(d,{sm:12,children:e.jsxs("div",{className:"text-center",children:[e.jsx("h2",{children:e.jsx("i",{className:"mdi mdi-check-all"})}),e.jsx("h3",{children:"Thank you!"}),e.jsx("p",{children:"Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat."})]})}),e.jsx(d,{sm:12,children:e.jsxs("ul",{className:"list-inline wizard mb-0",children:[e.jsx("li",{className:"previous list-inline-item",children:e.jsx(b,{onClick:u,type:"button",variant:"info",children:"Previous"})}),e.jsx("li",{className:"next list-inline-item float-end",children:e.jsx(b,{variant:"success",type:"submit",children:"Submit"})})]})})]})})]})]})]})})},ge=()=>e.jsxs(q.Fragment,{children:[e.jsx(Y,{breadCrumbItems:[{label:"Forms",path:"/ui/forms/wizard"},{label:"Form Wizard",path:"/ui/forms/wizard",active:!0}],title:"Form Wizard"}),e.jsxs(f,{children:[e.jsx(d,{xl:6,children:e.jsx(ee,{})}),e.jsx(d,{xl:6,children:e.jsx(ne,{})})]}),e.jsx(f,{children:e.jsx(d,{lg:6,children:e.jsx(se,{})})})]});export{ge as default};
