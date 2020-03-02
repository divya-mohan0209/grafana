import React, { PureComponent } from 'react';
import { MapStateToProps, connect, MapDispatchToProps } from 'react-redux';
import { StoreState } from 'app/types';
import { ClickOutsideWrapper } from '@grafana/ui';
import { VariableLink } from '../shared/VariableLink';
import { VariableInput, NavigationKeys } from '../shared/VariableInput';
import { commitChangesToVariable, filterOptions } from './actions';
import {
  OptionsPickerState,
  showVariableDropDown,
  changeOptionsPickerHighlightIndex,
  toggleAllVariableOptions,
  selectVariableOption,
  toggleVariableTag,
  getTags,
} from './reducer';
import { VariableWithOptions, VariableWithMultiSupport, VariableOption } from '../../variable';
import { searchQueryChanged, selectVariableOptionByHighlightIndex } from '../../query/actions';
import { VariableOptions } from '../shared/VariableOptions';
import { VariablePickerProps } from '../../state/types';

interface OwnProps extends VariablePickerProps<VariableWithMultiSupport> {}

interface ConnectedProps {
  picker: OptionsPickerState;
}

interface DispatchProps {
  searchQueryChanged: typeof searchQueryChanged;
  showVariableDropDown: typeof showVariableDropDown;
  commitChangesToVariable: typeof commitChangesToVariable;
  filterOptions: typeof filterOptions;
  changeOptionsPickerHighlightIndex: typeof changeOptionsPickerHighlightIndex;
  selectVariableOptionByHighlightIndex: typeof selectVariableOptionByHighlightIndex;
  toggleAllVariableOptions: typeof toggleAllVariableOptions;
  selectVariableOption: typeof selectVariableOption;
  toggleVariableTag: typeof toggleVariableTag;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

export class OptionsPickerUnconnected extends PureComponent<Props> {
  onShowOptions = () => this.props.showVariableDropDown(this.props.variable);
  onHideOptions = () => this.props.commitChangesToVariable();
  onToggleOption = (option: VariableOption, clearOthers: boolean) => {
    this.props.selectVariableOption({
      option,
      clearOthers,
      forceSelect: false,
    });
  };

  onNavigateOptions = (key: NavigationKeys) => {
    if (key === NavigationKeys.cancel) {
      return this.onHideOptions();
    }

    if (key === NavigationKeys.select) {
      return this.props.selectVariableOptionByHighlightIndex();
    }

    if (key === NavigationKeys.selectAndClose) {
      this.props.selectVariableOptionByHighlightIndex();
      return this.onHideOptions();
    }

    if (key === NavigationKeys.moveDown) {
      return this.props.changeOptionsPickerHighlightIndex(1);
    }

    if (key === NavigationKeys.moveUp) {
      return this.props.changeOptionsPickerHighlightIndex(-1);
    }

    return undefined;
  };

  render() {
    const { variable, picker } = this.props;
    const showOptions = picker.uuid === variable.uuid;

    if (!variable) {
      return <div>Couldn't load variable</div>;
    }

    return (
      <div className="variable-link-wrapper">
        {this.renderLink(showOptions, variable)}
        {this.renderOptions(showOptions, picker)}
      </div>
    );
  }

  renderLink(showOptions: boolean, variable: VariableWithMultiSupport) {
    if (showOptions) {
      return null;
    }

    const linkText = getLinkText(variable);
    const tags = getTags(variable);

    return <VariableLink text={linkText} tags={tags} onClick={this.onShowOptions} />;
  }

  renderOptions(showOptions: boolean, picker: OptionsPickerState) {
    if (!showOptions) {
      return null;
    }

    return (
      <ClickOutsideWrapper onClick={this.onHideOptions}>
        <VariableInput
          value={picker.searchQuery}
          onChange={this.props.filterOptions}
          onSearch={this.props.searchQueryChanged}
          onKeyDown={this.onNavigateOptions}
        />
        <VariableOptions
          values={picker.options}
          onToggle={this.onToggleOption}
          onToggleAll={this.props.toggleAllVariableOptions}
          onToggleTag={this.props.toggleVariableTag}
          highlightIndex={picker.highlightIndex}
          multi={picker.multi}
          tags={picker.tags}
          selectedValues={picker.selectedValues}
        />
      </ClickOutsideWrapper>
    );
  }
}

const getLinkText = (variable: VariableWithOptions) => {
  const { current, options } = variable;

  if (!current.tags || current.tags.length === 0) {
    if (typeof current.text === 'string') {
      return current.text;
    }
    return current.text.join(' + ');
  }

  // filer out values that are in selected tags
  const selectedAndNotInTag = options.filter(option => {
    if (!option.selected) {
      return false;
    }

    if (!current || !current.tags || !current.tags.length) {
      return false;
    }

    for (let i = 0; i < current.tags.length; i++) {
      const tag = current.tags[i];
      const foundIndex = tag?.values?.findIndex(v => v === option.value);
      if (foundIndex && foundIndex !== -1) {
        return false;
      }
    }
    return true;
  });

  // convert values to text
  const currentTexts = selectedAndNotInTag.map(s => s.text);

  // join texts
  const newLinkText = currentTexts.join(' + ');
  return newLinkText.length > 0 ? `${newLinkText} + ` : newLinkText;
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  showVariableDropDown,
  commitChangesToVariable,
  filterOptions: filterOptions,
  searchQueryChanged,
  changeOptionsPickerHighlightIndex,
  selectVariableOptionByHighlightIndex,
  toggleAllVariableOptions,
  selectVariableOption,
  toggleVariableTag,
};

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = state => ({
  picker: state.optionsPicker,
});

export const OptionsPicker = connect(mapStateToProps, mapDispatchToProps)(OptionsPickerUnconnected);
OptionsPicker.displayName = 'OptionsPicker';