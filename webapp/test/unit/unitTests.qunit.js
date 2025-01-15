/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comhcl/accounts_operations/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
