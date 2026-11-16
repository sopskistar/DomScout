from pathlib import Path
import base64,json
root=Path(__file__).resolve().parents[1];out=root/'public/brand'
font=base64.b64encode((out/'plex-sans.ttf').read_bytes()).decode()
mark='<path fill="#F97316" fill-rule="evenodd" d="M4 4h11c8 0 13 5 13 13s-5 13-13 13H4V4Zm6 6v14h5c5 0 7-3 7-7s-2-7-7-7h-5Z"/><path fill="#FFFFFF" d="M21 22h11v11H21z"/><path fill="#C2410C" d="M25 25h7v7h-7z"/>'
# The square is a detached suffix, removed from the D's lower-right corner.
markTransparent=mark.replace('<path fill="#FFFFFF" d="M21 22h11v11H21z"/>','')
def svg(w,h,body,title='DomScout'):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>'
# A mask maintains a true transparent notch on light and dark backgrounds.
def symbol():return '<defs><mask id="notch"><rect width="40" height="40" fill="white"/><path fill="black" d="M21 22h11v11H21z"/></mask></defs><g mask="url(#notch)">'+mark.split('<path fill="#FFFFFF"')[0]+'</g><path fill="#C2410C" d="M25 25h7v7h-7z"/>'
(out/'icon.svg').write_text(svg(40,40,symbol()))
(out/'icon-dark.svg').write_text(svg(40,40,symbol().replace('#C2410C','#FB923C')))
style=f'<style>@font-face{{font-family:Plex;src:url(data:font/ttf;base64,{font})}}text{{font-family:Plex,sans-serif;font-weight:600;letter-spacing:-1.5px}}</style>'
for mode,ink in [('light','#18181B'),('dark','#FFFFFF')]:
 body=style+'<g transform="translate(0 4) scale(1.2)">'+symbol()+'</g>'+f'<text x="53" y="39" font-size="38" fill="{ink}">DomScout</text>'
 (out/f'logo-{mode}.svg').write_text(svg(252,56,body))
 (out/f'wordmark-{mode}.svg').write_text(svg(200,48,style+f'<text x="0" y="36" font-size="38" fill="{ink}">DomScout</text>'))
for name,width,height in [('og',1200,630),('social',1200,630),('github-preview',1280,640)]:
 body=style+f'<rect width="{width}" height="{height}" fill="#FFFFFF"/><path fill="#C2410C" d="M0 0h20v{height}H0z"/><g transform="translate(76 70) scale(1.7)">'+symbol()+'</g><text x="155" y="125" font-size="52" fill="#18181B">DomScout</text><text x="76" y="300" font-size="72" fill="#18181B">Follow the evidence.</text><text x="80" y="370" font-size="28" font-weight="400" fill="#52525B">Domain discovery, with the research in view.</text><path stroke="#E4E4E7" d="M80 470H1120"/><text x="80" y="530" font-size="24" fill="#C2410C">Discovery / Evidence / Personal rules</text>'
 (out/f'{name}.svg').write_text(svg(width,height,body))
(root/'public/manifest.json').write_text(json.dumps({'name':'DomScout','short_name':'DomScout','start_url':'/','display':'standalone','background_color':'#FFFFFF','theme_color':'#C2410C','icons':[{'src':'/brand/app-192.png','sizes':'192x192','type':'image/png'},{'src':'/brand/app-512.png','sizes':'512x512','type':'image/png'}]},indent=2))
print('Original SVG identity and social artwork generated with embedded licensed font.')
