import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VolcEngineTOSApi implements ICredentialType {
	name = 'volcEngineTOSApi';
	displayName = 'VolcEngine TOS API Credentials API';

	documentationUrl = 'https://cloud.bytedance.net/docs/ark/docs/664afad9e16ff302cb5c0706/677f47d0fef4e10365fccc1d?x-resource-account=public&x-bc-region-id=bytedance';

	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
      "name": "accessKey",
      "displayName": "Access Key",
      "type": "string",
      "default": "",
      "required": true,
      "description": "ByteDance Cloud Access Key"
    },
    {
      "name": "secretKey",
      "displayName": "Secret Key",
      "type": "string",
      "default": "",
      "required": true,
      "typeOptions": {
        "password": true
      },
      "description": "ByteDance Cloud Secret Key"
    },
    {
      "name": "bucket",
      "displayName": "Bucket Name",
      "type": "string",
      "default": "",
      "required": true,
      "description": "TOS bucket name"
    },
    {
      "name": "region",
      "displayName": "Region",
      "type": "string",
      "default": "cn-north-1",
      "required": true,
      "description": "TOS region (e.g. cn-north-1, cn-south-1)"
    },
    {
      "name": "endpoint",
      "displayName": "Endpoint",
      "type": "string",
      "default": "",
      "required": false,
      "description": "Custom endpoint URL for TOS (optional)"
    }

	];

}
