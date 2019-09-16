export class ScimSchemaItem{

	constructor({
		name, 
		type = "string", 
		multiValued = false, 
		description="", 
		required = false,
		caseExact = false,
		mutability = "readWrite",
		returned = "default",
		uniqueness = "none",
		canonicalValues
	}){
		this.name = name
		this.type = type
		this.multiValued = multiValued
		this.description = description
		this.required = required
		this.caseExact = type == 'string'? caseExact:undefined
		this.mutability = mutability
		this.returned = returned
		this.uniqueness = uniqueness
		this.canonicalValues = canonicalValues
	}

	static convertOidToType(oid){
		oid = oid.split('{')[0]
		switch(oid){
		default:
			console.warn(`oid: ${oid} unexpected`)
		// binary, but it binary in adapter does not match SCIM binary so use string
		case "1.3.6.1.4.1.1466.115.121.1.5":
		// string
		case "1.3.6.1.4.1.1466.115.121.1.15":
		// bit string
		case "1.3.6.1.4.1.1466.115.121.1.6":
		// DN
		case "1.3.6.1.4.1.1466.115.121.1.12":
			return "string"
		case "1.3.6.1.4.1.1466.115.121.1.7":
			return "boolean"
		case "1.3.6.1.4.1.1466.115.121.1.27":
			return "integer"
		case "1.3.6.1.4.1.1466.115.121.1.24":
			return "dateTime"
		}
	}

	static determineAttributeType(schemaItem, formItem){
		let type = ScimSchemaItem.convertOidToType(schemaItem.syntax[0])
		let constraint
		if (formItem){
			if (type == "string"){
				if (formItem.optDateInput) {
					return "dateTime";
				}
				if (formItem.dateInput) {
					return "dateTime";
				}
				if (formItem.checkbox) {
					return "boolean";
				}				
				if (formItem.constraint){
					if (constraint = formItem.constraint.find(o=>o.type[0].toUpperCase() == "INTEGER_ONLY") 
						&& constraint && constraint.parameter[0] == true)
						return "integer"
					if (constraint = formItem.constraint.find(o=>o.type[0].toUpperCase() == "NUMERIC") 
						&& constraint && constraint.parameter[0] == true)
						return "decimal"
				}
			}
		}
		return type
	}

	static isRequired(schemaAttribute, formItem){
		let constraint
		console.log(`isRequired: ${schemaAttribute}, ${formItem}`)
		// need to cast undefined into false
		return schemaAttribute.$.required || 
			!!(formItem 
				&& formItem.constraint 
				&& (constraint = formItem.constraint.find(o=>o.type[0].toUpperCase() == "REQUIRED")) 
				&& constraint.parameter[0]) 
	}

	static isPassword(formItem){
		if (formItem 
			&& formItem.input 
			&& formItem.input[0].$.type
			&& formItem.input[0].$.type.toUpperCase() ==  "PASSWORD") {
			return true;
		}		
		return false;

	}

	static isAlwaysAttributes(att){
		let attUpperCaseName = att.$.ref.toUpperCase()
		if (attUpperCaseName == "DESCRIPTION" ||
			attUpperCaseName == "ERSERVICENAME") {
			return true;
		}		
		return false;

	}

	static getMutability(formItem){
		if (formItem){
			if (formItem.$.isReadOnlyAlways)
				return "readOnly";

			if (formItem.$.isReadOnlyOnModify === true ||
				formItem.$.isHiddenOnModify === true) {
				return "immutable";
			}

			if (this.isPassword(formItem)) {
				return "writeOnly";
			}			
		}
		// NOTE default value
		return "readWrite"
	}

	static getReturned(formItem, att){
		//we don't deal with eruid here since we hardcode the scimschema item for that
		if(this.isPassword(formItem))
			return "never"
		else if (this.isAlwaysAttributes(att))
			return "always"
		return "default"
	}

	static getCanonicalValues(formItem){
		// need to parse label files so I am not going to implement this
		return undefined;
	}
}

