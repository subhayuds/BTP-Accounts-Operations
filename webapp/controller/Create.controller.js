sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",

],

  function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.hcl.accountsoperations.controller.Create", {
      onInit: function () {

      },


      onCancel: function () {

        sap.ui.getCore().getEventBus().publish("subaccount", "refresh");
        // Navigate to the Home page
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("RouteHome");

        // var OEventBus = sap.ui.getCore().getEventBus();
        // OEventBus.publish("subaccounts", "refresh");

        

        // var oHomeController = sap.ui.getCore().byId("HomeView").getController();
        // oHomeController.readSubAccountsModel();
      },

      onSelectAll: function (oEvent, tableId) {
        var oTable = this.getView().byId(tableId);
        var oCheckbox = oEvent.getSource();
        var bSelectAll = oCheckbox.getSelected();

        if (bSelectAll) {
          oTable.selectAll();
        } else {
          var aItems = oTable.getItems();
          aItems.forEach(function (oItem) {
            oItem.setSelected(false);
          })

        }

      },

      onApplicationsSelectAll: function (oEvent) {
        this.onSelectAll(oEvent, "_IDGenTable")
      },

      onIntegrationsSelectAll: function (oEvent) {
        this.onSelectAll(oEvent, "_IDGenTable1")
      },

      onAutomationsSelectAll: function (oEvent) {
        this.onSelectAll(oEvent, "_IDGenTable2")
      },

      onDataSelectAll: function (oEvent) {
        this.onSelectAll(oEvent, "_IDGenTable3")
      },

      onAiSelectAll: function (oEvent) {
        this.onSelectAll(oEvent, "_IDGenTable4")
      },


      onSubmit: function () {
        var btableFieldValid = true;
        const panels = [
          { checkbox: "_IDGenCheckBox", directoryName: "Applications", tableId: "_IDGenTable" },
          { checkbox: "_IDGenCheckBox2", directoryName: "Integrations", tableId: "_IDGenTable1" },
          { checkbox: "_IDGenCheckBox3", directoryName: "Automations", tableId: "_IDGenTable2" },
          { checkbox: "_IDGenCheckBox4", directoryName: "Data & Analytics", tableId: "_IDGenTable3" },
          { checkbox: "_IDGenCheckBox5", directoryName: "AI", tableId: "_IDGenTable4" },
        ];

        let isAnyCheckboxSelected = false;
        let isAnyRowSelected = false;
        let panelsWithNoRows = []; // Store directory names with checkboxes selected but no rows
        let hasValidationError = false;
        let itemsForMessageBox = []; // Store directories and subaccounts for MessageBox



        panels.forEach((panel) => {
          const oCheckbox = this.getView().byId(panel.checkbox);
          const isCheckboxSelected = oCheckbox.getSelected();
          const selectedRows = this.collectSelectedRows(panel.tableId);

          if (isCheckboxSelected) {
            isAnyCheckboxSelected = true;
            itemsForMessageBox.push({ name: panel.directoryName, type: "directory", status: "loading" }); // Add directory to MessageBox items

            // If checkbox is selected but no rows, add to the list
            if (selectedRows.length === 0) {
              panelsWithNoRows.push(panel.directoryName);
            } else {
              isAnyRowSelected = true; // Track that at least one row is selected
            }

            // Validate each row for required fields
            selectedRows.forEach((row) => {
              itemsForMessageBox.push({ name: row.name, type: "subaccount", status: "loading" }); // Add subaccounts to MessageBox items
              if (!row.name || !row.region || !row.subdomain) {
                hasValidationError = true;

                // Find input controls and set ValueState
                const oTable = this.getView().byId(panel.tableId);
                const oRow = oTable.getSelectedItems().find((item) =>
                  item.getBindingContext("BTPAccountsModel").getObject() === row
                );

                

                if (oRow) {
                  const cells = oRow.getCells(); // Get input controls in the row

                  // Validate and update ValueState
                  cells.forEach((cell) => {

                    let property;
                    let value;

                    // Check if it's a ComboBox (region field)
                    if (cell.isA("sap.m.ComboBox")) {
                      property = "region"; // Set property manually for ComboBox
                      value = cell.getSelectedKey(); // Get the selected key for region
                    } else {
                      property = cell.getBinding("value")?.getPath(); // Get bound property for other input fields
                      value = cell.getValue(); // Get the value of the input field
                    }

                    // Validate for empty values
                    if (["name", "region", "subdomain"].includes(property) && !value) {
                      btableFieldValid = false;
                      cell.setValueState("Error");
                      cell.setValueStateText(`${property} is required.`);
                    } else {
                      cell.setValueState("None");
                      
                    }
                  });
                }


              }
            });

          }

          if (!btableFieldValid) {
            return;
          }

         

          if (selectedRows.length > 0) {
            isAnyRowSelected = true;
          }

        });

        if (btableFieldValid) {
          if (isAnyCheckboxSelected && isAnyRowSelected) {
            this.showProgressMessageBox(itemsForMessageBox);
        }

        if (!isAnyCheckboxSelected && !isAnyRowSelected) {
          MessageBox.warning("No directory or subaccounts selected.");
          return;
        }

        if (panelsWithNoRows.length > 0) {
          const message = `No rows selected in the following panels: ${panelsWithNoRows.join(", ")}.`;
          MessageBox.warning(message);
          return;
        }

        setTimeout(() => {
          panels.forEach((panel) => {
            const oCheckbox = this.getView().byId(panel.checkbox);
            const isCheckboxSelected = oCheckbox.getSelected();
            const selectedRows = this.collectSelectedRows(panel.tableId);

            if (isCheckboxSelected && selectedRows.length > 0) {
              this.createDirectoryOrHandleConflict(panel.directoryName, selectedRows, itemsForMessageBox);
            }
          });

        }, 0);

        }



        
        // if (isAnyCheckboxSelected && isAnyRowSelected) {
        //   this.showProgressMessageBox(itemsForMessageBox);
        //   //return;
        // }


        // If no checkboxes and no rows are selected, show a general warning
        // if (!isAnyCheckboxSelected && !isAnyRowSelected) {
        //   MessageBox.warning("No directory or subaccounts selected.");
        //   return;
        // }

        // If any panels have checkboxes selected but no rows, show a single aggregated warning
        // if (panelsWithNoRows.length > 0) {
        //   const message = `No rows selected in the following panels: ${panelsWithNoRows.join(", ")}.`;
        //   MessageBox.warning(message);
        //   return;
        // }

        // setTimeout(() => {
        //   panels.forEach((panel) => {
        //     const oCheckbox = this.getView().byId(panel.checkbox);
        //     const isCheckboxSelected = oCheckbox.getSelected();
        //     const selectedRows = this.collectSelectedRows(panel.tableId);

        //     if (isCheckboxSelected && selectedRows.length > 0) {
        //       this.createDirectoryOrHandleConflict(panel.directoryName, selectedRows, itemsForMessageBox);
        //     }
        //   });

        // }, 0);

      },

      collectSelectedRows: function (tableId) {
        const oTable = this.getView().byId(tableId);
        const selectedItems = oTable.getSelectedItems();
        const selectedSubAccounts = [];

        selectedItems.forEach(function (oItem) {
          const oSubaccount = oItem.getBindingContext("BTPAccountsModel").getObject();
          selectedSubAccounts.push(oSubaccount);
        });

        return selectedSubAccounts;
      },

      createDirectoryOrHandleConflict: function (directoryName, selectedRows, itemsForMessageBox) {
        var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
        var apiUrl = prefix + "accounts/v1/directories/";

        const requestData = { "displayName": directoryName };

        $.ajax({
          url: apiUrl,
          async: false,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(requestData),
          success: function (response) {
            MessageToast.show("Directory created successfully!");
            selectedRows.forEach((row) => row.parentGUID = response.guid); // GUID from success response
            this.createSubaccounts(selectedRows, itemsForMessageBox);
            this.updateProgressItemStatus(itemsForMessageBox, directoryName, "directory", "success"); // Update success status
          }.bind(this),
          error: function (xhr) {
            if (xhr.status === 409) {
              // Conflict - Directory already exists, retrieve GUID
              this.retrieveDirectoryGUIDFromGlobalAccount(directoryName, selectedRows, itemsForMessageBox);
            } else {
              // Handle other errors
              this.updateProgressItemStatus(itemsForMessageBox, directoryName, "directory", "error"); // Update error status
              MessageBox.error("Failed to create directory. Error: " + xhr.responseJSON.message);
            }
          }.bind(this),
        });
      },

      retrieveDirectoryGUIDFromGlobalAccount: function (directoryName, selectedRows, itemsForMessageBox) {
        const prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
        var globalAccountUrl = prefix + "accounts/v1/globalAccount?expand=true";

        $.ajax({
          url: globalAccountUrl,
          async: false,
          type: "GET",
          success: function (response) {
            const directories = response.children || [];
            let directoryGUID = null;

            // Search for the directory by displayName and directoryType: Folder
            directories.some((directory) => {
              if (directory.displayName === directoryName && directory.directoryType === "FOLDER") {
                directoryGUID = directory.guid;
                return true;  // Break the loop once found
              }
              return false;
            });

            if (directoryGUID) {
              // Set the parentGUID for each selected row and create subaccounts
              selectedRows.forEach((row) => row.parentGUID = directoryGUID);
              this.createSubaccounts(selectedRows, itemsForMessageBox);
              this.updateProgressItemStatus(itemsForMessageBox, directoryName, "directory", "success"); // Update success status


            } else {
              this.updateProgressItemStatus(itemsForMessageBox, directoryName, "directory", "error"); // Update error status
              MessageBox.error(`Directory "${directoryName}" already exists, but its GUID could not be found.`);
            }
          }.bind(this),
          error: function (xhr) {
            this.updateProgressItemStatus(itemsForMessageBox, directoryName, "directory", "error"); // Update error status
            MessageBox.error("Failed to retrieve directory GUID. Error: " + xhr.responseJSON.message);
          }.bind(this),
        });
      },

      createSubaccounts: function (requestData, itemsForMessageBox) {
        var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
        var apiUrl = prefix + "accounts/v1/subaccounts/"


        requestData.forEach((data) => {
          const payload = {
            displayName: data.name,
            description: data.Description,
            region: data.Region,
            parentGUID: data.parentGUID,
            subdomain: data.subdomain,
          };

          $.ajax({
            url: apiUrl,
            async: false,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function () {
              this.updateProgressItemStatus(itemsForMessageBox, data.name, "subaccount", "success"); // Update success status
              MessageToast.show("Subaccount created successfully!");

            }.bind(this),
            error: function (xhr) {
              this.updateProgressItemStatus(itemsForMessageBox, data.name, "subaccount", "error"); // Update error status
              MessageBox.error("Failed to create subaccount. Error: " + xhr.responseJSON.message);
            }.bind(this),
          });
        });
      },

      showProgressMessageBox: function (items) {
        // Display progress message box with all items in 'loading' state
        if (!this.progressBox) {
          this.progressBox = new sap.m.VBox({
            items: items.map((item) => new sap.m.HBox({
              items: [
                new sap.m.BusyIndicator({ visible: item.status === "loading", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                new sap.ui.core.Icon({ src: "sap-icon://status-positive", visible: item.status === "success", color: "green", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                new sap.ui.core.Icon({ src: "sap-icon://status-negative", visible: item.status === "error", color: "red", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                new sap.m.Text({ text: `${item.type === 'directory' ? 'Directory' : 'Subaccount'}: ${item.name}` }),
              ]
            }))
          });

          sap.m.MessageBox.show(this.progressBox, {
            title: "Creation Progress",
            actions: [sap.m.MessageBox.Action.CLOSE],
            onClose: function () {
              this.progressBox = null;
            }.bind(this)
          });
        } else {
          // Update the existing progress box if already present
          this.progressBox.removeAllItems();
          items.forEach((item) => {
            this.progressBox.addItem(
              new sap.m.HBox({
                items: [
                  new sap.m.BusyIndicator({ visible: item.status === "loading", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                  new sap.ui.core.Icon({ src: "sap-icon://status-positive", visible: item.status === "success", color: "green", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                  new sap.ui.core.Icon({ src: "sap-icon://status-negative", visible: item.status === "error", color: "red", layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" }) }),
                  new sap.m.Text({ text: `${item.type === 'directory' ? 'Directory' : 'Subaccount'}: ${item.name}` }),
                ]
              })
            );
          });
        }
      },

      updateProgressItemStatus: function (items, name, type, status) {
        items.forEach((item) => {
          if (item.name === name && item.type === type) {
            item.status = status;
          }
        });
        // Refresh the MessageBox UI
        this.showProgressMessageBox(items);
      },

      onSubaccountNameChange: function (oEvent) {
        var sInputName = oEvent.getParameter("value"); // Get the entered name
        var sSanitized = sInputName
          .toLowerCase() // Convert to lowercase
          .replace(/[^a-z0-9-]/g, "-") // Replace invalid characters with hyphens
          .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

        // Append a random alphanumeric suffix for uniqueness (optional but recommended)
        var sRandomSuffix = Math.random().toString(36).substring(2, 8); // Generate 6 random alphanumeric chars
        var sGeneratedSubdomain = sSanitized + "-" + sRandomSuffix;

        // Get the binding context of the current input
        var oBindingContext = oEvent.getSource().getBindingContext("BTPAccountsModel");
        var oModel = oBindingContext.getModel();

        // Update the subdomain property in the model
        oModel.setProperty(oBindingContext.getPath() + "/subdomain", sGeneratedSubdomain);
      }

    });
  }
);
