import css from 'css'
import bulmaCSS from 'bulma/css/bulma.css'

export const getBulmaCSSContent = () => {
  return css.parse(bulmaCSS)
}

export const getDeclaration = (css: css.Stylesheet, className: string) => {
  const declaration = css.stylesheet!.rules!.find(
    (rule) => rule.type === 'rule' && rule.selectors.includes(`.${className}`)
  ) as css.Rule

  if (declaration.selectors.length > 1) {
    declaration.selectors = [`.${className}`]
  }

  return declaration
}

export const isValidSelector = (css: css.Stylesheet, selector: string) => {
  const isValid = css.stylesheet!.rules!.some(
    (rule) => rule.type === 'rule' && rule.selectors.includes(`.${selector}`)
  )

  return isValid
}

export const getStringFromCSS = (declaration: css.Rule) => {
  const cssString = css.stringify({
    type: 'stylesheet',
    stylesheet: {
      rules: [declaration]
    }
  })

  return cssString
}
