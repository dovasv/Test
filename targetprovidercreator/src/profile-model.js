import {parseString} from 'xml2js'
import {parseBooleans} from 'xml2js/lib/processors'
import {ScimSchemaItem} from 'scim-schema-item'
import {HttpClient} from 'aurelia-fetch-client'
import {ResourceType} from 'resourceType'
import {otherSchemas} from 'otherschema'
import {SchemaExtension} from 'schema-extension'
import {TargetProfileTemplate} from 'targetprofiletemplate'
import zip from 'zipjs'

export class ProfileModel{

	constructor(){

		//needed because I cannot access 'this' in nested methods somehow despite js spec says I should
		self = this
		zip.workerScriptsPath="jspm_packages/github/gildas-lormeau/zip.js\@master/WebContent/"

	}

	initializeModel() {
		self.accountForm;
		self.groupForms = []
		self.profilename = undefined
		self.model;
		self.resourceTypes = []
		self.ServiceGroups;
		self.schemaRoot = null
		self.serviceGroupMapping = []
		self.otherSchemaMapping = []
		self.groupFormsNames = []
		self.accountFormName = ""
		self.serviceFormName = ""
		self.accountProfile = ""
		self.model = TargetProfileTemplate.getTemplate()
		console.dir(self.model)
	}

	parse(file, options, callback){
		console.log("parsing profile")
		self.initializeModel()
		self.model.providerConfig.changePassword = options.allowChangePassword
		self.caseExact= options.attributeCaseSensitive

		this.createListing(file, (entries)=>{
			let profileResolve = new Promise((resolve, reject) =>{
				self.model.name = self.profilename
				console.log(self.profilename)

				console.log(self.model.description)
				self.model.description = self.profilename + self.model.description

				if (entries.find(entry => entry.filename == `${self.profilename}/service.def`)){
					this.getProfileDataJson(entries, `${self.profilename}/service.def`).then(data =>{
						this.processSdiProfile(data)
						resolve()			
					})
				}else if (entries.find(entry => entry.filename == `${self.profilename}/resource.def`)){
					this.getProfileDataJson(entries, `${self.profilename}/resource.def`).then(data =>{
						console.log('adk')
						self.model.providerType = "ADK"

						self.accountClassName = data.Resource.AccountDefinition[0].$.ClassName
						self.accountFormName = self.accountClassName + ".xml"
						self.accountProfile = data.Resource.ServiceDefinition[0].$.AccountProfileName

						self.model.resourceTypes.push(new ResourceType(self.profilename+"User", 
																	"User",
																	data.Resource.AccountDefinition[0].$.Description,
																	"User",
																	"urn:ietf:params:scim:schemas:core:2.0:User",
																	self.accountProfile))

						self.serviceClassName = data.Resource.ServiceDefinition[0].$.ServiceClass
						self.serviceFormName = self.serviceClassName+".xml"
						// let GroupDefinitions = new Array()

						if (data.Resource.ServiceGroups &&
							data.Resource.ServiceGroups[0].GroupDefinition &&
							data.Resource.ServiceGroups[0].GroupDefinition.length > 0){
								self.model.resourceTypes.push(new ResourceType(self.profilename+"Group",
														 "Group", 
														 self.profilename+" Group resourceType", 
														 "Group", 
														 "urn:ietf:params:scim:schemas:core:2.0:Group",
														 data.Resource.ServiceGroups[0].GroupDefinition.map(groupDefinition=>groupDefinition.$.ProfileName)))

							
							self.groupFormsNames = Array.from(data.Resource.ServiceGroups[0].GroupDefinition, groupDefinition => {

								let groupName = groupDefinition.AttributeMap[0].Attribute.find(o=>o.$.Name.toLowerCase() == 'ergroupname').$.Value;
								self.model.groupExtensions.push(new SchemaExtension("Group", 
																					`${groupDefinition.$.ProfileName}GroupExtension`,
																					groupDefinition.$.ProfileName, 
																					groupName,
																					groupDefinition.$.ProfileName))
								self.serviceGroupMapping.push({className: groupDefinition.$.ClassName, profileName: groupDefinition.$.ProfileName})
								if(groupDefinition.$.form) 
									return groupDefinition.$.form[0].$.location
								else
									return groupDefinition.$.ClassName + ".xml"
							}).filter(Boolean)							
							self.model.userExtension.attributeMapping.coreAttributes.groups =
								data.Resource.ServiceGroups[0].GroupDefinition.map(group=>{
									let obj = {}
									obj.value = group.$.AccountAttribute + '.' + 
									group.AttributeMap[0].Attribute.find(o=>o.$.Name.toUpperCase() == "ERGROUPID").$.Value
									console.log('group value = ' + obj.value)
									obj.display = group.AttributeMap[0].Attribute.find(o=>o.$.Name.toUpperCase() == "ERGROUPNAME").$.Value
									obj.type = ""
									return obj

								})

						}
						resolve()
					})
				}else reject("invalid profile, service.def/resource.def not found inside jar")			
			}).then(()=> {
				let accountFormDone = new Promise((resolve, reject) => {
					this.getProfileDataJson(entries, `${this.profilename}/${self.accountFormName}`)
						.then(form => {
							this.accountForm = form
							resolve(form)
						})
				})

				let serviceFormDone = new Promise((resolve, reject) => {
					this.getProfileDataJson(entries, `${this.profilename}/${self.serviceFormName}`)
						.then(form => {
							this.serviceForm = form
							resolve(form)
						})
				})

				console.log("self.groupFormsNames:")
				console.dir(self.groupFormsNames)
				let groupFormsDone = Array.from(self.groupFormsNames, v => {
					console.log("groupFormsName= " + v)
					return new Promise((resolve, reject) => {
					this.getProfileDataJson(entries, `${this.profilename}/${v}`)
						.then(form =>{
							this.groupForms.push(form)
							resolve(form)
						})
						.catch(()=>{
							console.warn("group form not found in profile!, ignoring this error")
							resolve()
						})
					})
				})
				return Promise.all([].concat(accountFormDone).concat(serviceFormDone).concat(groupFormsDone))

			}).then(([accountForm, serviceForm, ...groupForms])=>{
				console.info("forms:")
				console.dir(accountForm)
				console.dir(serviceForm)
				console.dir(groupForms)
				this.groupForms = groupForms
				this.getProfileDataJson(entries, `${self.profilename}/schema.dsml`)
				.then(this.createUserExtension)
				.then(this.createTargetSchema)
				.then(this.createServiceGroupsExtension)
				.then(this.createOthesSchema)
				.then(callback())
				.catch(error=>{
					console.error("caught rejection: " + error)
					callback(error)
				})
			})
			.catch(error=>{
				console.error("caught error: " + error)
				callback(error)
			})
		})
	}


	processSdiProfile(data){
		self.model.providerType = "SDI"

		let accountType = data.Service.type.find(type=>type.$.category.toLowerCase() == 'account')
		self.accountClassName = accountType.$.name
		self.accountFormName = accountType.form[0].$.location
		self.accountProfile = accountType.$.profile
		console.log("accountform name = " + self.accountFormName)
		console.log("account profile = " + self.accountProfile)
		self.model.resourceTypes.push(new ResourceType(self.profilename+"User", 
													"User",
													"",
													"User",
													"urn:ietf:params:scim:schemas:core:2.0:User",
													accountType.$.profile))

		let serviceType = data.Service.type.find(type=>type.$.category.toLowerCase() == 'service')
		self.serviceClassName = serviceType.$.name
		 self.serviceFormName = serviceType.form[0].$.location

		// let GroupDefinitions = new Array()

		if (data.Service.ServiceGroups &&
			data.Service.ServiceGroups[0].GroupDefinition &&
			data.Service.ServiceGroups[0].GroupDefinition.length > 0){
			self.model.resourceTypes.push(new ResourceType(self.profilename+"Group",
										"Group", 
										 self.profilename+" Group resourceType", 
										 "Group", 
										 "urn:ietf:params:scim:schemas:core:2.0:Group",
										 data.Service.ServiceGroups[0].GroupDefinition.map(groupDefinition=>groupDefinition.$.profileName)))

			
			self.groupFormsNames = Array.from(data.Service.ServiceGroups[0].GroupDefinition, groupDefinition => {
				let groupName = groupDefinition.AttributeMap[0].Attribute.find(o=>o.$.name.toLowerCase() == 'ergroupname').$.value;
				self.model.groupExtensions.push(new SchemaExtension("Group", `${groupDefinition.$.profileName}GroupExtension`, groupDefinition.$.profileName, groupName,groupDefinition.$.profileName))
				self.serviceGroupMapping.push({className: groupDefinition.$.className, profileName: groupDefinition.$.profileName})
				if(groupDefinition.$.form) 
					return groupDefinition.$.form[0].$.location
				else
					return groupDefinition.$.className + ".xml"
			}).filter(Boolean)	
			console.log("self.groupFormsNames: " + self.groupFormsNames)

			self.model.userExtension.attributeMapping.coreAttributes.groups =
				data.Service.ServiceGroups[0].GroupDefinition.map(group=>{
					let obj = {}
					obj.value = group.$.accountAttribute + '.' + 
						group.AttributeMap[0].Attribute.find(o=>o.$.name.toUpperCase() == "ERGROUPID").$.value
					console.log('group value = ' + obj.value)
					obj.display = group.AttributeMap[0].Attribute.find(o=>o.$.name.toUpperCase() == "ERGROUPNAME").$.value
					obj.type = ""
					return obj

				})
		}
	}

	createTargetSchema(schemaDsmlData){
		console.log("createTargetSchema")
		self.model.targetSchema.schema = 'urn:ibm:idbrokerage:params:scim:schemas:' + self.profilename + ':2.0:Target';
		var targetschema = self.model.targetSchema.definition;
		targetschema.id = self.model.targetSchema.schema
		targetschema.description =  self.profilename+ " Target definition"
		self.schemaRoot = schemaDsmlData.dsml['directory-schema'][0]
		let serviceClassIndex = self.schemaRoot.class.findIndex(o=>o.name.join().toUpperCase() == self.serviceClassName.toUpperCase())
		let serviceClass = self.schemaRoot.class.splice(serviceClassIndex,1)[0]
		let serviceFormItems = [].concat.apply([], self.serviceForm.page.body[0].tabbedForm[0].tab.map(v=>v.formElement))


		//create curry function since array.map does not take parameters
		let createTargetSchemaItem = (()=>{
			return function(schemaItem){
				return self.createScimSchemaItem.call(this, schemaItem, true)
			}
		})()

		targetschema.attributes = serviceClass.attribute.map(createTargetSchemaItem, serviceFormItems).filter(Boolean)
		//create target resourceTypes
		self.model.resourceTypes.push(new ResourceType(self.profilename+"Target",
						 "Target", 
						 self.profilename+" Target resourceType", 
						 "Target", 
						 self.model.targetSchema.schema))

		if (!targetschema.attributes.find(o=>o.name.toUpperCase() == "ERSERVICENAME")){
			targetschema.attributes = targetschema.attributes.concat (new ScimSchemaItem({
				name: "erservicename",
				description: "name for this target",
				type: "string",
				required: true,
				returned: "always",
				caseExact: self.caseExact
			}))			
		}

		targetschema.attributes.sort((a, b)=>{
				if (a.name.toLowerCase() == "erservicename") return -1
				else if (b.name.toLowerCase() == "erservicename") return 1
				else if (a.name.toLowerCase() == "description") return -1
				else if (b.name.toLowerCase() == "description") return 1
				else if (a.name.toLowerCase() == "eritdiurl") return -1
				else if (b.name.toLowerCase() == "eritdiurl") return 1
				else return a.name.localeCompare(b.name)
			})
		return schemaDsmlData
	}

	createUserExtension(schemaDsmlData){
		console.log("createUserExtension")
		const accountStatusDesc = "An identifier used to indicate if the account is active(0) or suspended(1)."
		const accountStatusCanonVal = [0, 1] 
		let userExtension = self.model.userExtension
		userExtension.schema = `urn:ibm:idbrokerage:params:scim:schemas:extension:${self.accountProfile}:2.0:User`
		userExtension.definition.id = userExtension.schema
		self.schemaRoot = schemaDsmlData.dsml['directory-schema'][0]
		let accountClassIndex = self.schemaRoot.class.findIndex(o=>o.name.join().toUpperCase() == self.accountClassName.toUpperCase())
		let accountClass = self.schemaRoot.class.splice(accountClassIndex, 1)[0]
		let accountformItems = undefined
		if (self.accountForm.page.body[0].tabbedForm !== undefined){
			accountformItems = [].concat.apply([], self.accountForm.page.body[0].tabbedForm[0].tab.map(v=>v.formElement))
		}else {
			accountformItems = [].concat(self.accountForm.page.body[0].form[0].formElement)
		}
		userExtension.definition.attributes = accountClass.attribute.map(self.createScimSchemaItem, accountformItems).filter(Boolean)
		let accountStatusSchema;
		userExtension.attributeMapping.objectProfile = self.accountProfile
		if (accountStatusSchema = userExtension.definition.attributes.find(o=> o.name.toUpperCase() == "ERACCOUNTSTATUS")){
			accountStatusSchema.description = accountStatusDesc
			accountStatusSchema.canonicalValues = accountStatusCanonVal
			accountStatusSchema.type = "integer"
		}else{
			userExtension.definition.attributes = userExtension.definition.attributes.concat(new ScimSchemaItem(
			 {name :"eraccountstatus",
			 description : accountStatusDesc,
				 canonicalValues : accountStatusCanonVal,
				 type: "integer" }))
		}
		
		userExtension.definition.attributes = userExtension.definition.attributes.sort((a, b)=>{
			if (a.name.toLowerCase() == "eruid") return -1
			else if (b.name.toLowerCase() == "eruid") return 1
			else if (a.name.toLowerCase() == "erpassword") return -1
			else if (b.name.toLowerCase() == "erpassword") return 1
			else if (a.name.toLowerCase() == "eraccountstatus") return -1
			else if (b.name.toLowerCase() == "eraccountstatus") return 1
			else return a.name.localeCompare(b.name)
		})

		self.model.resourceTypes[0].description = accountClass.description[0]
		return schemaDsmlData
	}

	createServiceGroupsExtension(schemaDsmlData){
		console.log("createServiceGroupsExtension")
				console.dir(schemaDsmlData)

		self.serviceGroupMapping.map(mapping=>{
			let formItem = null
					self.schemaRoot = schemaDsmlData.dsml['directory-schema'][0]

			let groupExtension = self.model.groupExtensions.find(o=>o.attributeMapping.objectProfile.toUpperCase() == mapping.profileName.toUpperCase())
			let objectclassIndex = self.schemaRoot.class.findIndex(o=>o.name == mapping.className)
			if (objectclassIndex < 0)
				return
			let objectclass = self.schemaRoot.class.splice(objectclassIndex, 1)[0]
			console.log(groupExtension + ":::" + objectclass)

			objectclass.attribute.map(o => {
				let schemaItem = self.schemaRoot['attribute-type'].find(obj=>obj.name.join().toUpperCase() == o.$.ref.toUpperCase())
				console.dir(schemaItem)
				if (schemaItem){
					groupExtension.definition.attributes.push(
						new ScimSchemaItem({
						name : o.$.ref,
						type : ScimSchemaItem.determineAttributeType(schemaItem, formItem), 
						multiValued : false, 
						description : schemaItem.description?schemaItem.description[0]:"", 
						required : ScimSchemaItem.isRequired(o, formItem), 
						mutability : ScimSchemaItem.getMutability(formItem),
						canonicalValues : undefined,
						caseExact: self.caseExact
					}))
				}else{
					groupExtension.definition.attributes.push(
						new ScimSchemaItem({name : o.$.ref}))
				}
			})
			groupExtension.definition.attributes.push({
				"name" : "memberAssignments",
				"type" : "complex",
				"multiValued" : true,
				"description" : "A list of members of the Group.",
				"required" : false,
				"subAttributes" : [
				{
					"name" : "value",
					"type" : "string",
					"multiValued" : false,
					"description" : "Identifier of the member of this Group.",
					"required" : false,
					"caseExact" : false,
					"mutability" : "readWrite",
					"returned" : "default",
					"uniqueness" : "none"
				},
				{
					"name" : "$ref",
					"type" : "reference",
					"referenceTypes" : [
						"User",
						"Group"
					],
					"multiValued" : false,
					"description" : "The URI corresponding to a SCIM resource that is a member of this Group.",
					"required" : false,
					"caseExact" : false,
					"mutability" : "readOnly",
					"returned" : "default",
					"uniqueness" : "none"
					},
				{
					"name" : "type",
					"type" : "string",
					"multiValued" : false,
					"description" : "A label indicating the type of resource,e.g., 'User' or 'Group'.",
					"required" : false,
					"caseExact" : false,
					"canonicalValues" : [
						"User",
						"Group"
					],
					"mutability" : "readOnly",
					"returned" : "default",
					"uniqueness" : "none"
				}],
			"mutability" : "readWrite",
			"returned" : "default"
			})
		})
		return schemaDsmlData

	}

	createOthesSchema(schemaDsmlData){
		let schemaRoot = schemaDsmlData.dsml['directory-schema'][0]
		console.log("length = " + schemaRoot.class.length)
		if (schemaRoot.class.length > 0){
			self.model.resourceTypes.push(new ResourceType(self.profilename+"SupportingData",
				"SupportingData",
				self.profilename + " SupportingData ResourceType",
				"SupportingData",
				"urn:ibm:idbrokerage:params:scim:schemas:"+ self.profilename + ":2.0:SupportingData"))
		}
		schemaRoot.class.map(supportDataClass=>{
			let formItem = null
			let schemaName = '!!! PICK A USER FRIENDLY NAME'
			let schemaUrn = 'urn:ibm:idbrokerage:params:scim:schemas:extension:' + 
					self.profilename +
					':2.0:' + "!!! Use the value from 'name'"
			let otherSchema = {schema:'', definition:{id:'', name:'', attributes:[]},attributeMapping:{objectClass:'', display:''}}
			otherSchema.definition.id = otherSchema.schema = schemaUrn
			otherSchema.definition.name = schemaName
			otherSchema.attributeMapping.objectClass = supportDataClass.name[0]
			otherSchema.attributeMapping.display = '!!! FILL IN THE ATTRIBUTE CORRESPONDING TO THE DISPLAY TEXT'
			supportDataClass.attribute.map(o => {
				let schemaItem = self.schemaRoot['attribute-type'].find(obj=>obj.name.join().toUpperCase() == o.$.ref.toUpperCase())
				console.info("schemaItem:")
				console.dir(schemaItem)


				if (schemaItem) {
					otherSchema.definition.attributes.push(
						new ScimSchemaItem({
						name : o.$.ref, 
						type : ScimSchemaItem.determineAttributeType(schemaItem, formItem), 
						multiValued : false, 
						description : schemaItem.description?schemaItem.description[0]:"", 
						required : ScimSchemaItem.isRequired(o, formItem), 
						mutability : "readOnly",
						canonicalValues : undefined,
						caseExact: self.caseExact
					}))				
				}else if (o.$.ref.toUpperCase() == "ERGROUPDESCRIPTION"){
					otherSchema.definition.attributes.push(
						new ScimSchemaItem({
						name : o.$.ref, 
						description : "group description", 
						required : "false", 
						mutability : "readOnly",
						canonicalValues : undefined,
						caseExact: self.caseExact
					}))					
				}else {
					otherSchema.definition.attributes.push(
						new ScimSchemaItem({
						name : o.$.ref,
						mutability : "readOnly"
					}))
				}
			})
			self.model.otherSchemas.push(otherSchema)
			self.model.resourceTypes[self.model.resourceTypes.length-1].schemaExtensions.push(schemaUrn + ' in otherSchemas')
		})
		return schemaDsmlData
	}


    createScimSchemaItem(att, useOnlyItemsInForms) {
    	if (att.$.ref.toLowerCase().match('eradapter.*')) 
    		return

		switch(att.$.ref.toLowerCase()){
		case "eruid":
			return new ScimSchemaItem({
				name :  "eruid",
				description :  "A identifier used to uniquely identify a user",
				required :  true,
				mutability :  "immutable",
				uniqueness :  "server",
				caseExact: self.caseExact})
			break
		case "erpassword":
			return new ScimSchemaItem({
				name : "erpassword",
				description :  "A password used to authenticate a user.",
				caseExact :  true,
				mutability :  "writeOnly",
				returned :  "never"})
			break;
		case "eritdiurl":
			return new ScimSchemaItem({
				name : "eritdiurl",
				description : "URL of SDI dispatcher",
				required :  true,
				caseExact: false})
			break;
		default:
			let attUpperCaseName = att.$.ref.toUpperCase()
			let schemaItem = self.schemaRoot['attribute-type'].find(o=>o.name.join().toUpperCase() == attUpperCaseName)
			let formItem = this.find(o=>o.$.name.slice(5).toUpperCase() == attUpperCaseName)
			if (useOnlyItemsInForms === true && formItem == undefined){
				console.warn("no form item")
				return null
			}

			if (!schemaItem){
				schemaItem = {
					$: {
						'single-value': true,
					},
					description: [att.$.ref],
					//oid for string
					syntax: ["1.3.6.1.4.1.1466.115.121.1.15"]

				}
			}

			let attributeType = ScimSchemaItem.determineAttributeType(schemaItem, formItem)
			return new ScimSchemaItem({
				name : att.$.ref, 
				type : attributeType, 
				multiValued : !schemaItem.$['single-value'], 
				description : schemaItem.description?schemaItem.description[0]:"", 
				required : ScimSchemaItem.isRequired(att, formItem), 
				mutability : ScimSchemaItem.getMutability(formItem),
				returned: ScimSchemaItem.getReturned(formItem, att),
				canonicalValues : undefined,
				caseExact: attributeType == 'string'?self.caseExact:undefined
			})
		}
	}


	getSchema(entries){
		let promise = new Promise((resolve, reject))
	}

	getProfileDataJson(entries, filename){
		let promise = new Promise((resolve, reject) =>{
			// console.info("entries:")
			// console.dir(entries)
			let entry = entries.find(entry => entry.filename == filename)
			if (!entry) reject(`${filename} entry not found in profile`)
			entry.getData(new zip.TextWriter(), fileText =>{
				// console.log(`fileText = ${fileText}`)
				//parsexml
				parseString(fileText, 
					{valueProcessors: [parseBooleans]
					, attrValueProcessors: [parseBooleans]
						// , normalizeTags: true  //cannot use as it only do tags, not attribute
					}, 
					(err, result) => resolve(result)
				)
			})
		})
		return promise
	}

	createListing(file, callback){
		this.profilename = file.name.split(".")[0]
		zip.createReader(new zip.BlobReader(file), zipReader => {
			zipReader.getEntries(callback);
		}, () => {throw "create zipReader error"});
	}
}