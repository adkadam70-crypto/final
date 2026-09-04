// Preload for running the seed/migrate scripts locally.
//
// This machine's network DNS resolver refuses *.neon.tech lookups (the
// router returns REFUSED; 8.8.8.8 / 1.1.1.1 resolve it fine). Node's default
// resolution path (getaddrinfo / dns.lookup, used by fetch+undici and by pg)
// therefore fails, even though dns.resolve4 with public servers works.
//
// Fix: install a global undici dispatcher whose connect.lookup resolves via
// dns.resolve4 against public DNS instead of the OS resolver. The Neon
// serverless driver uses fetch(), so this is enough.
//
//   node --import ./scripts/_dns-fix.mjs --env-file=.env scripts/<name>.mjs
import dns from 'node:dns'
import { Agent, setGlobalDispatcher } from 'undici'

const resolver = new dns.promises.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

const lookup = (hostname, options, cb) => {
  resolver.resolve4(hostname).then(
    (addrs) => cb(null, options && options.all ? addrs.map((address) => ({ address, family: 4 })) : addrs[0], 4),
    (err) => cb(err),
  )
}

setGlobalDispatcher(new Agent({ connect: { lookup } }))
