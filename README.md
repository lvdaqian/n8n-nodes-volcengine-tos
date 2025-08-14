# n8n-nodes-volcengine-tos

This is an n8n community node. It lets you use VolcEngine TOS (Torch Object Storage) in your n8n workflows.

VolcEngine TOS is a secure, durable, and highly scalable cloud storage service provided by ByteDance's VolcEngine platform. It offers object storage capabilities for storing and retrieving any amount of data from anywhere.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Package name: `n8n-nodes-volcengine-tos`

## Operations

The VolcEngine TOS node supports the following operations:

- **Check Existence**: Check if a file exists in the specified bucket
- **Upload File**: Upload a file to VolcEngine TOS bucket with optional public access configuration

## Credentials

To use this node, you need to set up VolcEngine TOS API credentials:

### Prerequisites
1. Sign up for a VolcEngine account at [volcengine.com](https://www.volcengine.com/)
2. Create a TOS bucket in the VolcEngine console
3. Generate Access Key ID and Secret Access Key

### Authentication Setup
1. In n8n, go to **Credentials** and create new **VolcEngine TOS API** credentials
2. Fill in the following information:
   - **Access Key**: Your VolcEngine Access Key ID
   - **Secret Key**: Your VolcEngine Secret Access Key
   - **Bucket**: Your TOS bucket name
   - **Endpoint**: Your TOS service endpoint (e.g., `tos-s3-cn-beijing.volces.com`)
   - **Region**: Your bucket region (e.g., `cn-beijing`)

## Compatibility

- **Minimum n8n version**: 0.198.0
- **Node.js version**: >=20.15
- **Tested with**: n8n 1.x

This node uses the official `@volcengine/tos-sdk` (v2.7.5) for reliable integration with VolcEngine TOS.

## Usage

### Check File Existence
1. Select "Check Existence" operation
2. Provide the file path in the bucket
3. The node will return whether the file exists along with file URL and metadata

### Upload File
1. Select "Upload File" operation
2. Specify the target file path in the bucket
3. Choose the binary property containing the file data
4. Optionally enable "Make Public" to set public-read ACL
5. The node will upload the file and return the file URL and upload details

### Error Handling
The node includes comprehensive error handling and supports n8n's "Continue on Fail" option for robust workflow execution.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [VolcEngine TOS Documentation](https://www.volcengine.com/docs/6349)
* [VolcEngine TOS SDK Documentation](https://github.com/volcengine/ve-tos-js-sdk)
* [Project Repository](https://github.com/lvdaqian/n8n-nodes-volcengine-tos)


