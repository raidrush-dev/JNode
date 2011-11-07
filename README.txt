JNode ist ein Framework speziell für moderne Browser ohne unnötigen Ballast 
und Fallbacks für ältere Modelle.

Die API ist an Prototype angelehnt, ist aber nicht kompatibel mit 
existierendem Code.

Unterstützte Browser:

- Firefox 3.6+ / Seamonkey 2 / Fennec
-- Firefox 3.6 / Seamonkey 2.0 ohne CSS3-Transitions
-- Fennec muss noch gestestet werden

- Chrome / Safari 5.0+ / MobileWebkit
-- MobileWebkit unter Android 2.3 scheint Probleme mit Transforms zu haben

- Opera 10.5+
-- Ohne XMLHttpRequest Level 2. 
-- CSS3-Transitions sind u.U. Fehlerhaft

- MSIE 9+
-- Ohne XMLHttpRequest Level 2
-- Ohne FileAPI 
-- Ohne CSS-Transitions/Animations
