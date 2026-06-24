var modifiedHeaders = $request.headers;

if (modifiedHeaders) {
    modifiedHeaders['X-RevenueCat-ETag'] = '';
    modifiedHeaders['x-revenuecat-etag'] = ''; 
}

$done({ headers: modifiedHeaders });