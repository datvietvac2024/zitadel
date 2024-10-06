package middleware

import (
	"fmt"
	"strings"
)

type CSP struct {
	DefaultSrc     CSPSourceOptions
	ScriptSrc      CSPSourceOptions
	ObjectSrc      CSPSourceOptions
	StyleSrc       CSPSourceOptions
	ImgSrc         CSPSourceOptions
	MediaSrc       CSPSourceOptions
	FrameSrc       CSPSourceOptions
	FrameAncestors CSPSourceOptions
	FontSrc        CSPSourceOptions
	ManifestSrc    CSPSourceOptions
	ConnectSrc     CSPSourceOptions
	FormAction     CSPSourceOptions
	WorkerSrc      CSPSourceOptions
}

var (
	DefaultSCP = CSP{
		DefaultSrc:     CSPSourceOptsNone(),
		ScriptSrc:      CSPSourceOptsSelf(),
		ObjectSrc:      CSPSourceOptsNone(),
		StyleSrc:       CSPSourceOptsSelf(),
		ImgSrc:         CSPSourceOptsSelf(),
		MediaSrc:       CSPSourceOptsNone(),
		FrameSrc:       CSPSourceOptsNone(),
		FrameAncestors: CSPSourceOptsNone(),
		FontSrc:        CSPSourceOptsSelf(),
		ManifestSrc:    CSPSourceOptsSelf(),
		ConnectSrc:     CSPSourceOptsSelf(),
		WorkerSrc:      CSPSourceOptsSelf(),
	}
)

func (csp *CSP) Value(nonce, host string, allowHosts []string) string {
	valuesMap := csp.asMap(allowHosts)

	values := make([]string, 0, len(valuesMap))
	for k, v := range valuesMap {
		if v == nil {
			continue
		}

		values = append(values, fmt.Sprintf("%v %v", k, v.String(nonce, host)))
	}

	return strings.Join(values, ";")
}

func (csp *CSP) asMap(allowHosts []string) map[string]CSPSourceOptions {
	frameAncestors := csp.FrameAncestors
	connectSrc := csp.ConnectSrc
	scriptSrc := csp.ScriptSrc
	styleSrc := csp.StyleSrc
	workerSrc := csp.WorkerSrc
	if len(allowHosts) > 0 {
		frameAncestors = CSPSourceOpts().AddHost(allowHosts...)
		connectSrc = csp.ConnectSrc.AddHost(allowHosts...)
		scriptSrc = csp.ScriptSrc.AddHost(allowHosts...)
		styleSrc = csp.StyleSrc.AddHost(allowHosts...)
		workerSrc = csp.WorkerSrc.AddHost(allowHosts...)
	}
	return map[string]CSPSourceOptions{
		"default-src":     csp.DefaultSrc,
		"script-src":      scriptSrc,
		"object-src":      csp.ObjectSrc,
		"style-src":       styleSrc,
		"img-src":         csp.ImgSrc,
		"media-src":       csp.MediaSrc,
		"frame-src":       csp.FrameSrc,
		"frame-ancestors": frameAncestors,
		"font-src":        csp.FontSrc,
		"manifest-src":    csp.ManifestSrc,
		"connect-src":     connectSrc,
		"form-action":     csp.FormAction,
		"worker-src":      workerSrc,
	}
}

type CSPSourceOptions []string

func CSPSourceOpts() CSPSourceOptions {
	return CSPSourceOptions{}
}

func CSPSourceOptsNone() CSPSourceOptions {
	return []string{"'none'"}
}

func CSPSourceOptsSelf() CSPSourceOptions {
	return []string{"'self'"}
}

func (srcOpts CSPSourceOptions) AddSelf() CSPSourceOptions {
	return append(srcOpts, "'self'")
}

func (srcOpts CSPSourceOptions) AddInline() CSPSourceOptions {
	return append(srcOpts, "'unsafe-inline'")
}

func (srcOpts CSPSourceOptions) AddEval() CSPSourceOptions {
	return append(srcOpts, "'unsafe-eval'")
}

func (srcOpts CSPSourceOptions) AddStrictDynamic() CSPSourceOptions {
	return append(srcOpts, "'strict-dynamic'")
}

func (srcOpts CSPSourceOptions) AddHost(h ...string) CSPSourceOptions {
	return append(srcOpts, h...)
}

func (srcOpts CSPSourceOptions) AddOwnHost() CSPSourceOptions {
	return append(srcOpts, placeHolderHost)
}

func (srcOpts CSPSourceOptions) AddScheme(s ...string) CSPSourceOptions {
	return srcOpts.add(s, "%v:")
}

func (srcOpts CSPSourceOptions) AddNonce() CSPSourceOptions {
	return append(srcOpts, fmt.Sprintf("'nonce-%s'", placeHolderNonce))
}

const (
	placeHolderNonce = "{{nonce}}"
	placeHolderHost  = "{{host}}"
)

func (srcOpts CSPSourceOptions) AddHash(alg, b64v string) CSPSourceOptions {
	return append(srcOpts, fmt.Sprintf("'%v-%v'", alg, b64v))
}

func (srcOpts CSPSourceOptions) String(nonce, host string) string {
	value := strings.Join(srcOpts, " ")
	if !strings.Contains(value, placeHolderNonce) && !strings.Contains(value, placeHolderHost) {
		return value
	}
	return strings.ReplaceAll(strings.ReplaceAll(value, placeHolderHost, host), placeHolderNonce, nonce)
}

func (srcOpts CSPSourceOptions) add(values []string, format string) CSPSourceOptions {
	for i, v := range values {
		values[i] = fmt.Sprintf(format, v)
	}

	return append(srcOpts, values...)
}
