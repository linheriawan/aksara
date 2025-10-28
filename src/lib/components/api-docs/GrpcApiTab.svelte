<script lang="ts">
	import type { PageData } from '../../../routes/objects/[id]/api-docs/$types';

	let { data }: { data: PageData['object'] } = $props();

	const grpcConfig = $derived(() => data.publishing?.protocols?.grpc);
	const operations = $derived(() => grpcConfig()?.operations || ['Create', 'Get', 'List', 'Update', 'Delete']);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-gray-900">gRPC Service Contract</h2>
		<a href="/apis/grpc/{data.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
			Manage Service →
		</a>
	</div>

	<!-- Service Info -->
	<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
			<div>
				<span class="font-medium text-gray-700">Service Name:</span>
				<code class="ml-2 text-gray-900">{grpcConfig()?.serviceName || 'N/A'}</code>
			</div>
			<div>
				<span class="font-medium text-gray-700">Endpoint:</span>
				<code class="ml-2 text-gray-900">{grpcConfig()?.serviceUrl || 'localhost:50051'}</code>
			</div>
			<div>
				<span class="font-medium text-gray-700">Proto File:</span>
				<code class="ml-2 text-gray-900">{grpcConfig()?.protoFilename || 'N/A'}</code>
			</div>
			<div>
				<span class="font-medium text-gray-700">Published:</span>
				<span class="ml-2 text-gray-900">
					{#if grpcConfig()?.publishedAt}
						{new Date(grpcConfig().publishedAt).toLocaleDateString()}
					{:else}
						-
					{/if}
				</span>
			</div>
		</div>
	</div>

	<!-- Available Operations -->
	<div>
		<h3 class="text-sm font-semibold text-gray-700 mb-2">Available RPC Methods:</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
			{#each operations() as operation}
				<div class="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
					<code class="text-sm text-purple-900 font-mono">
						{operation}{data.name}
					</code>
				</div>
			{/each}
		</div>
	</div>

	<!-- Usage Example -->
	<div>
		<h3 class="text-sm font-semibold text-gray-700 mb-2">Client Usage Example:</h3>
		<div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
			<pre class="text-xs text-gray-100"><code>// Using grpcurl to test
grpcurl -plaintext \
  -d '{{"id": "123"}}' \
  {grpcConfig()?.serviceUrl || 'localhost:50051'} \
  {grpcConfig()?.serviceName || 'ServiceName'}.Get{data.name}

// Using Go client
import pb "yourproject/proto/{data.name.toLowerCase()}/v1"

client := pb.New{data.name}ServiceClient(conn)
resp, err := client.Get{data.name}(ctx, &pb.Get{data.name}Request{"{"}
  Id: "123",
{"}"})
</code></pre>
		</div>
	</div>

	<!-- Download Proto -->
	<div class="border-t pt-4">
		<a
			href="/api/grpc/proto/{data.id}"
			download={grpcConfig()?.protoFilename}
			class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
		>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				></path>
			</svg>
			Download Proto File
		</a>
	</div>
</div>
