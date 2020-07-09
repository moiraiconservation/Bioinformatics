<?php
header("Content-type: text/css; charset: UTF-8");
require_once realpath($_SERVER["DOCUMENT_ROOT"]).'/styles/theme.php';
///////////////////////////////////////////////////////////////////////////////
// DROPDOWN SECTION ///////////////////////////////////////////////////////////
$css = '
.dd_section__bttn_area {
  align-items: center;
  display: flex;
  justify-content: center;
  width: 100%;
}
.dd_section__bttn {
  display: block;
}
.dd_section__bttn > svg > path {
  transition: all 0.2s ease-in-out;
}
.dd_section__bttn:hover > svg > circle {
  cursor: pointer;
  fill: '.$theme["primary"]["light"].';
  stroke: transparent;
}
.dd_section__bttn:hover > svg > path {
  cursor: pointer;
  fill: '.$theme["text"]["primary"]["light"].';
  stroke: '.$theme["text"]["primary"]["light"].';
}
.dd_section__section_area {
  display: block;
  height: auto;
  max-height: 0px;
  overflow: hidden;
  -moz-transition: max-height .5s;
  -ms-transition: max-height .5s;
  -o-transition: max-height .5s;
  -webkit-transition: max-height .5s;
  transition: max-height .5s;
  width: 100%;
}
.dd_section__section {
}
';
///////////////////////////////////////////////////////////////////////////////
// ORGANISM NAME INPUT ////////////////////////////////////////////////////////
$css .= '
.dashed-card {
  background-color: '.$theme['base']['light'].';
  border: 2px dashed '.$theme['base']['dark'].';
  border-radius: 6px;
  color: '.$theme['text']['base']['light'].';
  height: 125px;
  margin: 0px;
  padding: 0px;
  width: 400px;
}
.dashed-card .input-invisible {
  -webkit-appearance: none;
  background-color: transparent;
  border: none !important;
  box-shadow: none !important;
  margin: 0px;
  padding: 0px;
  position: relative;
  outline: 0px !important;
  width: 100% !important;
}
.dashed-card:hover {
  cursor: pointer;
}
.dashed-card:hover .input-invisible {
  border: none !important;
  outline: 0px !important;
}
';
///////////////////////////////////////////////////////////////////////////////
// OUTPUT TERMINAL ////////////////////////////////////////////////////////////
$css .= '
.output_terminal {
  background-color: #242424;
  border-radius: 6px 6px 6px 6px;
  color: #d5d5d5;
  font-family: "Ubuntu Mono";
  -moz-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  height: 450px;
  overflow-y: scroll;
  padding: 10px 10px 10px 10px;
  text-rendering: optimizelegibility;
  width: 100%;
  word-wrap: break-word;
}
.output_terminal > p {
  line-height: 1.0em;
  margin: 0px;
  padding: 0px;
}
.output_terminal > br {
  line-height: 1.0em;
  margin: 0px;
  padding: 0px;
}
';
///////////////////////////////////////////////////////////////////////////////
// SKINS //////////////////////////////////////////////////////////////////////
$css .= '
.default_skin__common_name {
  display: inline-block;
  margin-left: 6px;
}
.default_skin__lock {
  background: '.$theme["base"]["dark"].';
  border-radius: 2px;
  height: 4px;
  margin-top: 6px;
  position: relative;
  width: 100%;
}
.default_skin__lock_bar {
  background: '.$theme["secondary"]["light"].';
  border-radius: 2px;
  display: block;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.default_skin__metadata {
}
.default_skin__option {
  /*display: none;*/
}
.default_skin__option_toggle {
  align-items: center;
  color: '.$theme["primary"]["foundation"].';
  display: flex;
  font-size: 18px;
  justify-content: center;
}
.default_skin__option_toggle:hover {
  color: '.$theme["primary"]["light"].';
}
.default_skin__organism_name {
  display: inline-block;
}
.default_skin__progress_ring { }
.default_skin__progress_ring__circle {
  -webkit-transition: all 2s ease-in-out, stroke-dashoffset 0.35s;
  -moz-transition: all 2s ease-in-out, stroke-dashoffset 0.35s;
  transition: all 2s ease-in-out, stroke-dashoffset 0.35s;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}
.default_skin__text {
  display: none;
}
.default_skin__tile {
  background-color: '.$theme['base']['light'].';
  border: 1px solid '.$theme['base']['dark'].';
  color: '.$theme['text']['base']['light'].';
  min-height: 94px;
  margin: 0px 0px 0px 0px;
  padding: 20px 20px 20px 20px;
  width: 100%;
}
.default_skin__tile p {
  font-size: 16px;
  line-height: 1.00em;
  margin-bottom: 5px;
}
.default_skin__title {
  font-weight: bold;
}
@media only screen and (max-width: 1200px) { } /* Large Devices, Wide Screens */
@media only screen and (max-width: 992px) { } /* Medium Devices, Desktops */
/* Small Devices, Tablets */
@media only screen and (max-width: 768px) {
  .default_skin__tile p { font-size: 14px; }
}
/* Extra Small Devices, Phones */
@media only screen and (max-width: 480px) {
  .default_skin__tile p { font-size: 12px; }
}
/* Custom, iPhone Retina */
@media only screen and (max-width: 320px ) {
  .default_skin__tile p { font-size:  10px; }
}
';
///////////////////////////////////////////////////////////////////////////////
// MINIFY AND RETURN THE CSS FILE /////////////////////////////////////////////
echo minify($css);
///////////////////////////////////////////////////////////////////////////////
?>
